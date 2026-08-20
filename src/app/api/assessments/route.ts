import { NextResponse } from "next/server";

import { evaluateAssessmentSafety } from "@/application/assessment-safety-gate.mjs";
import { transientAssessmentStore } from "@/application/transient-assessment-runtime.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { isSameOriginRequest } from "@/security/request-origin.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

const AGE_BANDS = new Set(["65-74", "75-84", "85-plus", "unknown"]);
const MODULES = new Set(["M01", "M07", "M08"]);

function cookieValue(request: Request, name: string) {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim().split("=")).find(([key]) => key === name)?.[1];
}

function redirectTo(request: Request, path: string) {
  const response = NextResponse.redirect(new URL(path, request.headers.get("origin") ?? request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new NextResponse("Forbidden", { status: 403 });
  const therapist = authSessionStore.get(cookieValue(request, SESSION_COOKIE));
  if (!therapist) return redirectTo(request, "/login?error=expired");
  const form = await request.formData();
  const caseAlias = String(form.get("caseAlias") ?? "").trim().toUpperCase();
  const ageBand = String(form.get("ageBand") ?? "");
  const modules = [...new Set(form.getAll("modules").map(String))];
  const safetyResponses = {
    acuteNeurologicalChange: String(form.get("acuteNeurologicalChange") ?? ""),
    medicalInstability: String(form.get("medicalInstability") ?? ""),
    newSevereSymptom: String(form.get("newSevereSymptom") ?? ""),
  };
  if (!/^CASE-[A-Z0-9-]{2,24}$/.test(caseAlias) || !AGE_BANDS.has(ageBand) || modules.length === 0 || modules.some((item) => !MODULES.has(item))) {
    return redirectTo(request, "/assessment/new?error=invalid");
  }
  const safety = evaluateAssessmentSafety(safetyResponses);
  const sessionId = transientAssessmentStore.create({
    therapistUserId: therapist.therapistUserId,
    patientPayload: { caseAlias, ageBand, modules, safetyResponses, safety },
  });
  return redirectTo(request, `/assessment/${encodeURIComponent(sessionId)}`);
}
