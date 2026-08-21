import { NextResponse } from "next/server";

import { evaluateAssessmentSafety } from "@/application/assessment-safety-gate.mjs";
import { validateAssessmentInput } from "@/application/assessment-input.mjs";
import { transientAssessmentStore } from "@/application/transient-assessment-runtime.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { isSameOriginRequest } from "@/security/request-origin.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

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
  const functionalLevel = String(form.get("functionalLevel") ?? "");
  const goalModes = [...new Set(form.getAll("goalModes").map(String))];
  const assistanceLevel = String(form.get("assistanceLevel") ?? "");
  const safetyResponses = {
    acuteNeurologicalChange: String(form.get("acuteNeurologicalChange") ?? ""),
    medicalInstability: String(form.get("medicalInstability") ?? ""),
    newSevereSymptom: String(form.get("newSevereSymptom") ?? ""),
  };
  const inputError = validateAssessmentInput({ caseAlias, ageBand, modules, functionalLevel, goalModes, assistanceLevel });
  if (inputError) return redirectTo(request, `/assessment/new?error=${inputError}`);
  const safety = evaluateAssessmentSafety(safetyResponses);
  const sessionId = transientAssessmentStore.create({
    therapistUserId: therapist.therapistUserId,
    patientPayload: { caseAlias, ageBand, modules, functionalLevel, goalModes, assistanceLevel, safetyResponses, safety },
  });
  return redirectTo(request, `/assessment/${encodeURIComponent(sessionId)}`);
}
