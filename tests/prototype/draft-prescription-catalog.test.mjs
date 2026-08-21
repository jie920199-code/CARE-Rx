import assert from "node:assert/strict";
import test from "node:test";

import { findDraftPrescriptionCandidates } from "../../src/application/draft-prescription-catalog.mjs";

test("blocked or incomplete safety states never expose draft candidates", async () => {
  assert.deepEqual(await findDraftPrescriptionCandidates({ modules: ["M01"], functionalLevel: "F2", safetyStatus: "safety_blocked" }), []);
  assert.deepEqual(await findDraftPrescriptionCandidates({ modules: ["M01"], functionalLevel: "F2", safetyStatus: "needs_information" }), []);
});

test("eligible draft preview matches both module and therapist-confirmed functional level", async () => {
  const candidates = await findDraftPrescriptionCandidates({ modules: ["M01", "M07"], functionalLevel: "F2", safetyStatus: "manual_review_required" });
  assert.deepEqual(candidates.map((item) => item.prescriptionId), ["RX-M01-BED-MULTICOMPONENT"]);
  assert.equal(candidates[0].executable, false);
  assert.equal(candidates[0].exportAllowed, false);
  assert.equal(candidates[0].clinicalReview.status, "pending_clinical_review");
});
