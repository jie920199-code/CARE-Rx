import { NextResponse } from "next/server";

import { loadAuthConfig } from "@/security/auth-config.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { loginRateLimiter } from "@/security/login-rate-limiter.mjs";
import { verifyPassword } from "@/security/password.mjs";
import { isSameOriginRequest } from "@/security/request-origin.mjs";
import { SESSION_COOKIE, sessionCookieOptions } from "@/security/session-cookie.mjs";

function redirectToLogin(request: Request, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new NextResponse("Forbidden", { status: 403 });
  const config = loadAuthConfig();
  if (!config.configured) return redirectToLogin(request, "unavailable");

  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const rateKey = username || "unknown";
  if (!loginRateLimiter.consume(rateKey)) return redirectToLogin(request, "invalid");

  const passwordMatches = await verifyPassword(password, config.passwordHash);
  if (username !== config.username || !passwordMatches) return redirectToLogin(request, "invalid");

  loginRateLimiter.reset(rateKey);
  const token = authSessionStore.create({
    therapistUserId: config.username,
    idleTimeoutMs: config.idleTimeoutMs,
    absoluteTimeoutMs: config.absoluteTimeoutMs,
  });
  const response = NextResponse.redirect(new URL("/workspace", request.url), 303);
  response.cookies.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions({ secureCookie: config.secureCookie, maxAge: config.absoluteTimeoutMs / 1000 }),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
