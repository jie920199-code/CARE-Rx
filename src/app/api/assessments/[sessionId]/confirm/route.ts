import { NextResponse } from "next/server";

import { transientAssessmentStore } from "@/application/transient-assessment-runtime.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { isSameOriginRequest } from "@/security/request-origin.mjs";
import { sameOriginRedirectUrl } from "@/security/request-redirect-url.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

function cookieValue(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim().split("=")).find(([key]) => key === name)?.[1];
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  if (!isSameOriginRequest(request)) return new NextResponse("Forbidden", { status: 403 });
  const therapist = authSessionStore.get(cookieValue(request, SESSION_COOKIE));
  if (!therapist) return NextResponse.redirect(sameOriginRedirectUrl(request, "/login?error=expired"), 303);
  const { sessionId } = await params;
  const assessment = transientAssessmentStore.get(sessionId);
  if (assessment.therapistUserId !== therapist.therapistUserId || assessment.patientPayload.safety.status !== "manual_review_required") {
    return new NextResponse("Forbidden", { status: 403 });
  }
  transientAssessmentStore.confirm(sessionId, therapist.therapistUserId);
  const response = NextResponse.redirect(sameOriginRedirectUrl(request, `/assessment/${encodeURIComponent(sessionId)}`), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
