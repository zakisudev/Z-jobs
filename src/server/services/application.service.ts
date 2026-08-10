import "server-only";
import { Prisma, type ApplicationStatus } from "@prisma/client";
import type { AuthCtx, TenantCtx } from "@/server/auth/context";
import { AppError } from "@/lib/errors";
import * as applications from "@/server/repos/application.repo";
import * as jobs from "@/server/repos/job.repo";
import * as audit from "@/server/repos/audit.repo";
import { sendMail, absoluteUrl } from "@/server/mail/mailer";

export async function apply(
  ctx: AuthCtx,
  input: { jobId: string; coverLetter?: string | undefined },
) {
  const job = await jobs.findPublicByIdForApply(input.jobId);

  // Uses the public predicate, so a draft, closed, or expired job cannot be
  // applied to by posting its id directly.
  if (!job) {
    throw new AppError("NOT_FOUND", "This job is no longer accepting applications.");
  }

  try {
    const application = await applications.createWithCount({
      jobId: job.id,
      seekerId: ctx.user.id,
      companyId: job.companyId,
      coverLetter: input.coverLetter,
    });

    await audit.record({
      actorUserId: ctx.user.id,
      companyId: job.companyId,
      action: "application.submitted",
      entityType: "Application",
      entityId: application.id,
      metadata: { jobId: job.id },
    });

    // Outside the transaction: an SMTP round trip must never hold row locks,
    // and a mail failure must not roll back the application.
    await sendMail({
      to: ctx.user.email,
      subject: `You applied to ${job.title}`,
      html: `<p>Your application for <strong>${job.title}</strong> at ${job.company.name} has been sent.</p><p><a href="${absoluteUrl(`/dashboard/applications`)}">Track your applications</a></p>`,
      text: `Your application for ${job.title} at ${job.company.name} has been sent.\n\nTrack it: ${absoluteUrl("/dashboard/applications")}`,
    });

    return { id: application.id, jobTitle: job.title };
  } catch (err) {
    // The unique constraint on (jobId, seekerId) is the real duplicate guard —
    // a prior "have you applied?" read would race with a double submit.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new AppError("CONFLICT", "You have already applied to this job.");
    }
    throw err;
  }
}

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ["VIEWED", "SHORTLISTED", "REJECTED"],
  VIEWED: ["SHORTLISTED", "INTERVIEW", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "OFFER", "REJECTED"],
  INTERVIEW: ["OFFER", "SHORTLISTED", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export async function changeStatus(
  ctx: TenantCtx,
  applicationId: string,
  to: ApplicationStatus,
) {
  const application = await applications.findForCompany(ctx, applicationId);
  if (!application) throw new AppError("NOT_FOUND", "That application no longer exists.");

  const allowed = ALLOWED_TRANSITIONS[application.status];
  if (!allowed.includes(to)) {
    throw new AppError(
      "VALIDATION",
      `An application that is ${application.status.toLowerCase()} cannot move to ${to.toLowerCase()}.`,
    );
  }

  const result = await applications.updateStatusForCompany(
    ctx,
    applicationId,
    application.status,
    to,
  );
  if (!result.ok) throw new AppError("NOT_FOUND", "That application no longer exists.");

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "application.status_changed",
    entityType: "Application",
    entityId: applicationId,
    metadata: { from: application.status, to },
  });

  // Status changes are the emails candidates actually read. Rejections included
  // — silence is worse than a clear, kind "no".
  await sendMail({
    to: application.seeker.email,
    subject: `Update on your application for ${application.job.title}`,
    html: `<p>Hi ${application.seeker.firstName},</p><p>Your application for <strong>${application.job.title}</strong> has moved to <strong>${to.toLowerCase()}</strong>.</p><p><a href="${absoluteUrl("/dashboard/applications")}">View your applications</a></p>`,
    text: `Hi ${application.seeker.firstName},\n\nYour application for ${application.job.title} has moved to ${to.toLowerCase()}.\n\n${absoluteUrl("/dashboard/applications")}`,
  });

  return { id: applicationId, status: to };
}
