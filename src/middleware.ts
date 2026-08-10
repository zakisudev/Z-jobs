import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every request.
 *
 * Replaces the old `backend/server.js` CORS block, which set
 * `Access-Control-Allow-Origin: *` together with `Allow-Credentials: true` — a
 * combination browsers reject outright. There is no cross-origin browser client
 * anymore, so nothing takes its place; what's needed instead is CSRF defence,
 * because cookie auth plus Route Handlers is the actual exposure.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Paths exempt from the Origin check. Payment webhooks arrive server-to-server
 * with no Origin header and are authenticated by HMAC signature instead.
 */
const ORIGIN_EXEMPT = ["/api/webhooks/"];

function isExempt(pathname: string): boolean {
  return ORIGIN_EXEMPT.some((p) => pathname.startsWith(p));
}

function securityHeaders(res: NextResponse, isProd: boolean): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  if (isProd) {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return res;
}

export function middleware(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const { pathname } = req.nextUrl;

  /**
   * CSRF: reject any state-changing request whose Origin isn't us.
   *
   * Next verifies this internally for Server Actions but NOT for Route
   * Handlers, which is exactly where a cookie-authenticated POST would be
   * abused.
   */
  if (!SAFE_METHODS.has(req.method) && !isExempt(pathname)) {
    const originHeader = req.headers.get("origin");

    /**
     * Compare HOSTS, not full origins.
     *
     * `req.nextUrl.origin` carries a scheme that is wrong behind a
     * TLS-terminating reverse proxy: Caddy serves https to the browser but
     * forwards plain http to Next, so the browser's `Origin: https://host`
     * never equals the internal `http://host`. Every state-changing request in
     * production would 403.
     *
     * The forwarded host is what the browser actually addressed, so that is
     * what the Origin must match.
     */
    const expectedHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");

    // A missing Origin on a same-origin form POST is normal in older browsers;
    // fall back to Sec-Fetch-Site, which modern browsers always send.
    const secFetchSite = req.headers.get("sec-fetch-site");

    let sameOrigin = false;
    if (originHeader === null) {
      sameOrigin = secFetchSite === "same-origin" || secFetchSite === "none";
    } else if (expectedHost) {
      try {
        sameOrigin = new URL(originHeader).host === expectedHost;
      } catch {
        sameOrigin = false; // malformed Origin
      }
    }

    if (!sameOrigin) {
      return securityHeaders(
        NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Cross-origin request blocked." } },
          { status: 403 },
        ),
        isProd,
      );
    }
  }

  return securityHeaders(NextResponse.next(), isProd);
}

export const config = {
  matcher: [
    /**
     * Everything except Next's own static output and common static assets.
     * Note `_next/image` is included so images inherit the security headers.
     */
    "/((?!_next/static|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2)$).*)",
  ],
};
