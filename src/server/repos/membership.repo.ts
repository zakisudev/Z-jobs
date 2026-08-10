import type { CompanyRole } from "@prisma/client";
import { db } from "@/server/db";

/**
 * Company membership. This is the join that authorises every employer action —
 * a user reaches a tenant only through an ACTIVE row here.
 */

/**
 * Resolves a company slug to a membership for one user. Returns null both when
 * the company doesn't exist and when the user isn't a member, so callers can
 * 404 uniformly and never leak which slugs are real.
 */
export function findBySlugForUser(userId: string, companySlug: string) {
  return db.companyMember.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      company: { slug: companySlug, deletedAt: null },
    },
    select: {
      role: true,
      companyId: true,
      company: { select: { slug: true, name: true } },
    },
  });
}

export function findByIdForUser(userId: string, companyId: string) {
  return db.companyMember.findFirst({
    where: { userId, companyId, status: "ACTIVE", company: { deletedAt: null } },
    select: {
      role: true,
      companyId: true,
      company: { select: { slug: true, name: true } },
    },
  });
}

/** Every company the user can act for — powers the company switcher. */
export function listForUser(userId: string) {
  return db.companyMember.findMany({
    where: { userId, status: "ACTIVE", company: { deletedAt: null } },
    select: {
      role: true,
      companyId: true,
      company: {
        select: { slug: true, name: true, logo: { select: { objectKey: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function listMembers(companyId: string) {
  return db.companyMember.findMany({
    where: { companyId },
    select: {
      id: true,
      role: true,
      status: true,
      createdAt: true,
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * Scoped by companyId as well as id — looking a member up by id alone would let
 * one tenant pass another tenant's memberId and mutate it, which is the exact
 * IDOR the TenantCtx convention exists to prevent.
 */
export function findMemberForCompany(companyId: string, memberId: string) {
  return db.companyMember.findFirst({
    where: { id: memberId, companyId },
    select: {
      id: true,
      role: true,
      status: true,
      userId: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });
}

export function findByEmailForCompany(companyId: string, email: string) {
  return db.companyMember.findFirst({
    where: { companyId, user: { email } },
    select: { id: true, role: true, status: true },
  });
}

export function updateRole(memberId: string, role: CompanyRole) {
  return db.companyMember.update({
    where: { id: memberId },
    data: { role },
    select: { id: true },
  });
}

export function remove(memberId: string) {
  return db.companyMember.delete({ where: { id: memberId }, select: { id: true } });
}

export function add(input: {
  companyId: string;
  userId: string;
  role: CompanyRole;
  invitedById?: string;
}) {
  return db.companyMember.create({ data: input, select: { id: true } });
}

/**
 * Counts remaining owners. Callers must use this before demoting or removing an
 * OWNER, otherwise a company can end up with nobody who can manage billing.
 */
export function countOwners(companyId: string) {
  return db.companyMember.count({
    where: { companyId, role: "OWNER", status: "ACTIVE" },
  });
}
