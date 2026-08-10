import "server-only";
import type { CompanyRole } from "@prisma/client";
import type { TenantCtx } from "@/server/auth/context";
import { AppError, ForbiddenError } from "@/lib/errors";
import { generateToken, hashToken, TOKEN_TTL, expiresIn } from "@/server/auth/tokens";
import { sendMail } from "@/server/mail/mailer";
import { companyInviteTemplate } from "@/server/mail/templates";
import * as companies from "@/server/repos/company.repo";
import * as memberships from "@/server/repos/membership.repo";
import * as invites from "@/server/repos/invite.repo";
import * as tokens from "@/server/repos/token.repo";
import * as audit from "@/server/repos/audit.repo";
import type { CompanyProfileInput } from "@/lib/schemas/company";

/**
 * Company administration: profile, settings, and the team.
 *
 * Every rule that protects a tenant from locking itself out lives here rather
 * than in the UI, because the UI is only one of the callers and the one that
 * cannot be trusted.
 */

export async function updateProfile(ctx: TenantCtx, input: CompanyProfileInput) {
  const company = await companies.updateProfile(ctx.companyId, input);

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "company.profile_updated",
    entityType: "Company",
    entityId: ctx.companyId,
  });

  return company;
}

export async function updateSettings(ctx: TenantCtx, input: { tin?: string | undefined }) {
  const company = await companies.updateSettings(ctx.companyId, input);

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "company.settings_updated",
    entityType: "Company",
    entityId: ctx.companyId,
  });

  return company;
}

export async function requestVerification(ctx: TenantCtx) {
  const moved = await companies.requestVerification(ctx.companyId);

  if (moved) {
    await audit.record({
      actorUserId: ctx.user.id,
      companyId: ctx.companyId,
      action: "company.verification_requested",
      entityType: "Company",
      entityId: ctx.companyId,
    });
  }

  return { requested: moved };
}

/**
 * Soft-deletes the company and closes its live listings.
 *
 * Restricted to OWNER even though the action wrapper already gates the route:
 * this is the one operation that cannot be undone from the UI, so it re-checks
 * rather than trusting a caller to have passed the right role list.
 */
export async function deleteCompany(ctx: TenantCtx) {
  if (ctx.companyRole !== "OWNER") {
    throw new ForbiddenError("Only an owner can delete the company.");
  }

  await companies.softDelete(ctx.companyId);

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "company.deleted",
    entityType: "Company",
    entityId: ctx.companyId,
  });

  return { deleted: true };
}

// ──────────────────────────────── team ────────────────────────────────

/**
 * Invites someone by email.
 *
 * The invite is a COMPANY_INVITE token, not an immediate membership: adding a
 * stranger to a tenant because someone typed their address would let any
 * employer attach an unwitting person to their company, and the person would
 * find out only when the company appeared in their switcher.
 *
 * The response is deliberately identical whether or not the address belongs to
 * an existing account, so the team page cannot be used to enumerate who has a
 * Z-Jobs account.
 */
export async function inviteMember(
  ctx: TenantCtx,
  input: { email: string; role: "ADMIN" | "RECRUITER" },
) {
  const existing = await memberships.findByEmailForCompany(ctx.companyId, input.email);
  if (existing) {
    throw new AppError("CONFLICT", "That person is already on your team.", {
      email: ["That person is already on your team."],
    });
  }

  const pending = await invites.findPendingForEmail(ctx.companyId, input.email);
  if (pending) {
    throw new AppError("CONFLICT", "An invitation is already pending for that address.", {
      email: ["An invitation is already pending for that address."],
    });
  }

  const { raw, hash } = generateToken();

  await tokens.create({
    tokenHash: hash,
    type: "COMPANY_INVITE",
    email: input.email,
    companyId: ctx.companyId,
    payload: { role: input.role, invitedById: ctx.user.id },
    expiresAt: expiresIn(TOKEN_TTL.COMPANY_INVITE),
  });

  const message = companyInviteTemplate(ctx.companyName, ctx.user.firstName, raw);
  await sendMail({ ...message, to: input.email });

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "team.invited",
    entityType: "Company",
    entityId: ctx.companyId,
    metadata: { email: input.email, role: input.role },
  });

  return { email: input.email };
}

export async function revokeInvite(ctx: TenantCtx, tokenId: string) {
  const result = await invites.revoke(ctx.companyId, tokenId);
  if (result.count === 0) throw new AppError("NOT_FOUND", "That invitation is no longer pending.");

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "team.invite_revoked",
    entityType: "Company",
    entityId: ctx.companyId,
  });

  return { revoked: true };
}

/**
 * Accepts an invitation.
 *
 * Runs as the signed-in user, and requires that the invited address matches the
 * account accepting it — otherwise a forwarded email would let anyone who
 * received it join the company.
 */
export async function acceptInvite(
  user: { id: string; email: string },
  rawToken: string,
) {
  const record = await tokens.findUsable(hashToken(rawToken), "COMPANY_INVITE");

  if (!record?.companyId || !record.email) {
    throw new AppError("NOT_FOUND", "This invitation has expired or already been used.");
  }

  if (record.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new ForbiddenError(
      `This invitation was sent to ${record.email}. Sign in with that address to accept it.`,
    );
  }

  const already = await memberships.findByEmailForCompany(record.companyId, user.email);
  if (already) {
    // Consume it anyway so a stale link stops working.
    await tokens.consume(record.id, user.id, "COMPANY_INVITE");
    const company = await companies.findById(record.companyId);
    return { companySlug: company?.slug ?? null, alreadyMember: true };
  }

  const payload = record.payload as { role?: string } | null;
  const role: CompanyRole =
    payload?.role === "ADMIN" || payload?.role === "RECRUITER"
      ? payload.role
      : "RECRUITER";

  // Claim the token BEFORE granting membership: the compare-and-swap in
  // `consume` is what stops two rapid clicks creating two memberships.
  const claimed = await tokens.consume(record.id, user.id, "COMPANY_INVITE");
  if (!claimed) {
    throw new AppError("CONFLICT", "This invitation has already been used.");
  }

  await memberships.add({ companyId: record.companyId, userId: user.id, role });

  const company = await companies.findById(record.companyId);

  await audit.record({
    actorUserId: user.id,
    companyId: record.companyId,
    action: "team.invite_accepted",
    entityType: "CompanyMember",
    metadata: { role },
  });

  return { companySlug: company?.slug ?? null, alreadyMember: false };
}

/**
 * Changes a member's role.
 *
 * The last-owner guard is the important part: without it a company can demote
 * its only owner and end up with nobody able to manage billing or delete it,
 * which is unrecoverable without database access.
 */
export async function changeMemberRole(
  ctx: TenantCtx,
  memberId: string,
  role: CompanyRole,
) {
  const member = await requireMember(ctx, memberId);

  if (member.role === role) return { id: member.id };

  if (member.role === "OWNER") {
    await assertNotLastOwner(ctx, "You are the only owner. Promote someone else first.");
  }

  await memberships.updateRole(memberId, role);

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "team.role_changed",
    entityType: "CompanyMember",
    entityId: memberId,
    metadata: { from: member.role, to: role },
  });

  return { id: memberId };
}

export async function removeMember(ctx: TenantCtx, memberId: string) {
  const member = await requireMember(ctx, memberId);

  if (member.role === "OWNER") {
    await assertNotLastOwner(ctx, "You cannot remove the only owner.");
  }

  await memberships.remove(memberId);

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "team.member_removed",
    entityType: "CompanyMember",
    entityId: memberId,
    metadata: { email: member.user.email, role: member.role },
  });

  return { id: memberId };
}

async function requireMember(ctx: TenantCtx, memberId: string) {
  const member = await memberships.findMemberForCompany(ctx.companyId, memberId);
  if (!member) throw new AppError("NOT_FOUND", "That team member no longer exists.");
  return member;
}

async function assertNotLastOwner(ctx: TenantCtx, message: string) {
  const owners = await memberships.countOwners(ctx.companyId);
  if (owners <= 1) throw new AppError("CONFLICT", message);
}
