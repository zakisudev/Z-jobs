import { absoluteUrl, type MailMessage } from "./mailer";

/**
 * Transactional email bodies.
 *
 * Deliberately plain inlined HTML with a text fallback rather than React Email
 * components at this stage: these four are simple, and every mail client
 * strips modern CSS anyway. When the employer/applicant emails arrive in
 * Phase 3 (with logos and job cards) they justify React Email; these do not.
 *
 * Every one ships a text/ part — HTML-only mail scores badly with spam filters,
 * which matters when verification gates the entire product.
 */

const BRAND = "Z-Jobs";

function layout(heading: string, body: string, cta?: { label: string; url: string }) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f7;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#0f766e;">${BRAND}</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">${heading}</h1>
          <div style="font-size:15px;line-height:1.6;color:#374151;">${body}</div>
          ${
            cta
              ? `<p style="margin:28px 0 0;">
                   <a href="${cta.url}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;font-weight:600;">${cta.label}</a>
                 </p>
                 <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6b7280;">
                   If the button doesn't work, copy this link into your browser:<br>
                   <span style="word-break:break-all;color:#0f766e;">${cta.url}</span>
                 </p>`
              : ""
          }
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px;">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">
            You received this because someone used this address on ${BRAND}. If it wasn't you, you can ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function verifyEmailTemplate(firstName: string, token: string): MailMessage {
  const url = absoluteUrl(`/verify-email?token=${token}`);
  return {
    to: "",
    subject: `Confirm your email address`,
    html: layout(
      `Welcome, ${firstName}`,
      `<p style="margin:0;">Confirm your email address to finish setting up your ${BRAND} account. This link expires in 24 hours.</p>`,
      { label: "Confirm email address", url },
    ),
    text: `Welcome, ${firstName}\n\nConfirm your email address to finish setting up your ${BRAND} account.\nThis link expires in 24 hours.\n\n${url}\n\nIf you didn't create an account, you can ignore this email.`,
  };
}

export function passwordResetTemplate(firstName: string, token: string): MailMessage {
  const url = absoluteUrl(`/reset-password?token=${token}`);
  return {
    to: "",
    subject: `Reset your ${BRAND} password`,
    html: layout(
      `Reset your password`,
      `<p style="margin:0;">Hi ${firstName}, we received a request to reset your password. This link expires in 1 hour and can be used once.</p>
       <p style="margin:12px 0 0;">If you didn't request this, no action is needed — your password will not change.</p>`,
      { label: "Choose a new password", url },
    ),
    text: `Reset your password\n\nHi ${firstName}, we received a request to reset your password.\nThis link expires in 1 hour and can be used once.\n\n${url}\n\nIf you didn't request this, no action is needed.`,
  };
}

/**
 * Sent after a successful reset. This is a security notice, not a courtesy —
 * it is how a user learns their account was taken over.
 */
export function passwordChangedTemplate(firstName: string): MailMessage {
  const url = absoluteUrl("/forgot-password");
  return {
    to: "",
    subject: `Your ${BRAND} password was changed`,
    html: layout(
      `Your password was changed`,
      `<p style="margin:0;">Hi ${firstName}, your ${BRAND} password was just changed and all other sessions were signed out.</p>
       <p style="margin:12px 0 0;"><strong>If this wasn't you</strong>, reset your password immediately.</p>`,
      { label: "Reset my password", url },
    ),
    text: `Your password was changed\n\nHi ${firstName}, your ${BRAND} password was just changed and all other sessions were signed out.\n\nIf this wasn't you, reset your password immediately:\n${url}`,
  };
}

export function accountLockedTemplate(firstName: string): MailMessage {
  const url = absoluteUrl("/forgot-password");
  return {
    to: "",
    subject: `Unusual sign-in activity on your ${BRAND} account`,
    html: layout(
      `Too many sign-in attempts`,
      `<p style="margin:0;">Hi ${firstName}, we locked your account for 15 minutes after several failed sign-in attempts.</p>
       <p style="margin:12px 0 0;">If that wasn't you, someone may be trying to guess your password. Resetting it will unlock your account right away.</p>`,
      { label: "Reset my password", url },
    ),
    text: `Too many sign-in attempts\n\nHi ${firstName}, we locked your account for 15 minutes after several failed sign-in attempts.\n\nIf that wasn't you, reset your password to unlock it now:\n${url}`,
  };
}

/**
 * Company invitation.
 *
 * Names the company and the person who sent it, because the recipient may have
 * no prior relationship with Z-Jobs at all — an invite that says only "you have
 * been invited to a company" reads as phishing and gets deleted.
 */
export function companyInviteTemplate(
  companyName: string,
  inviterName: string,
  token: string,
): MailMessage {
  const url = absoluteUrl(`/employer/invite?token=${token}`);
  return {
    to: "",
    subject: `${inviterName} invited you to ${companyName} on ${BRAND}`,
    html: layout(
      `Join ${companyName}`,
      `<p style="margin:0;">${inviterName} has invited you to help manage hiring for <strong>${companyName}</strong> on ${BRAND}.</p>
       <p style="margin:12px 0 0;">Accepting lets you post jobs and review applicants for this company. The invitation expires in 7 days.</p>`,
      { label: `Join ${companyName}`, url },
    ),
    text: `Join ${companyName}\n\n${inviterName} has invited you to help manage hiring for ${companyName} on ${BRAND}.\nAccepting lets you post jobs and review applicants for this company.\nThis invitation expires in 7 days.\n\n${url}\n\nIf you weren't expecting this, you can ignore this email.`,
  };
}
