import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { logger } from "@/server/logger";

/**
 * Mail port + Resend adapter.
 *
 * Replaces the old setup, where nodemailer was configured inline inside the
 * register controller. That had three separate faults this design removes:
 *   1. Links were hardcoded to http://localhost:5000, so no production user
 *      could ever verify. Here every URL is built from `env.APP_URL`.
 *   2. A send failure threw AFTER the user row was committed, leaving an
 *      orphaned account and a 500. Here `send` never throws.
 *   3. There was no way to test without sending real mail. Here an unset
 *      RESEND_API_KEY logs the message instead.
 */

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export interface Mailer {
  send(message: MailMessage): Promise<{ ok: boolean; id?: string }>;
}

class ResendMailer implements Mailer {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: MailMessage) {
    const { data, error } = await this.client.emails.send({
      from: env.MAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo || env.MAIL_REPLY_TO
        ? { replyTo: message.replyTo ?? env.MAIL_REPLY_TO }
        : {}),
    });

    if (error) {
      logger.error({ err: error.message, to: message.to }, "email send failed");
      return { ok: false };
    }

    return { ok: true, id: data.id };
  }
}

/** Development fallback: prints the message so verification links are usable. */
class ConsoleMailer implements Mailer {
  send(message: MailMessage) {
    logger.info(
      { to: message.to, subject: message.subject },
      `\n──────── EMAIL (not sent — RESEND_API_KEY unset) ────────\n` +
        `To:      ${message.to}\n` +
        `Subject: ${message.subject}\n\n` +
        `${message.text}\n` +
        `────────────────────────────────────────────────────────\n`,
    );
    return Promise.resolve({ ok: true });
  }
}

const mailer: Mailer = env.RESEND_API_KEY
  ? new ResendMailer(env.RESEND_API_KEY)
  : new ConsoleMailer();

/**
 * Fire-and-forget send.
 *
 * Deliberately swallows errors: a transactional email must never roll back or
 * fail the operation that triggered it. Callers must also never invoke this
 * inside a database transaction — an SMTP round trip would hold row locks open.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  try {
    await mailer.send(message);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err), to: message.to },
      "email send threw",
    );
  }
}

/** Every link in every email goes through here. No exceptions, no localhost. */
export function absoluteUrl(path: string): string {
  return `${env.APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
