import { NextResponse, type NextRequest } from "next/server";
import { generateToken, expiresIn, TOKEN_TTL } from "@/server/auth/tokens";
import * as tokens from "@/server/repos/token.repo";
import * as users from "@/server/repos/user.repo";
import { env } from "@/lib/env";

/**
 * DEV/TEST ONLY. Issues a fresh email-verification token and returns the raw
 * value, so end-to-end tests can follow the link a user would receive.
 *
 * This exists because the raw token is deliberately never persisted — only its
 * SHA-256 is — so there is no way to recover one after the fact. Issuing a new
 * token is exactly what "resend verification" does, so this grants no capability
 * the product doesn't already expose to the account's owner.
 *
 * Hard-disabled outside development: in production it 404s as if the route was
 * never deployed.
 */
export async function POST(req: NextRequest) {
  if (env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const body: unknown = await req.json();
  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String(body.email)
      : "";

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const user = await users.findByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "no such user" }, { status: 404 });
  }

  const { raw, hash } = generateToken();
  await tokens.create({
    tokenHash: hash,
    type: "EMAIL_VERIFY",
    userId: user.id,
    expiresAt: expiresIn(TOKEN_TTL.EMAIL_VERIFY),
  });

  return NextResponse.json({ token: raw });
}
