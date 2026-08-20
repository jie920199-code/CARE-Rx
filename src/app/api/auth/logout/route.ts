import { NextResponse } from "next/server";

import { loadAuthConfig } from "@/security/auth-config.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { isSameOriginRequest } from "@/security/request-origin.mjs";
import { SESSION_COOKIE, sessionCookieOptions } from "@/security/session-cookie.mjs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new NextResponse("Forbidden", { status: 403 });
  const token = request.headers.get("cookie")
    ?.split(";")
    .map((value) => value.trim().split("="))
    .find(([name]) => name === SESSION_COOKIE)?.[1];
  authSessionStore.delete(token);
  const config = loadAuthConfig();
  const response = NextResponse.redirect(new URL("/login", request.headers.get("origin") ?? request.url), 303);
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions({ secureCookie: config.secureCookie, maxAge: 0 }));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
