import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAssessmentSafety } from "../../src/application/assessment-safety-gate.mjs";

const allNo = { acuteNeurologicalChange: "no", medicalInstability: "no", newSevereSymptom: "no" };

test("a positive red-flag response blocks prescription matching", () => {
  const result = evaluateAssessmentSafety({ ...allNo, medicalInstability: "yes" });
  assert.equal(result.status, "safety_blocked");
  assert.equal(result.prescriptionMatchingAllowed, false);
});

test("unknown or missing safety information stops matching", () => {
  assert.equal(evaluateAssessmentSafety({ ...allNo, newSevereSymptom: "unknown" }).status, "needs_information");
  assert.equal(evaluateAssessmentSafety({ acuteNeurologicalChange: "no" }).status, "needs_information");
});

test("all negative draft responses still require manual review", () => {
  const result = evaluateAssessmentSafety(allNo);
  assert.equal(result.status, "manual_review_required");
  assert.equal(result.prescriptionMatchingAllowed, false);
});
