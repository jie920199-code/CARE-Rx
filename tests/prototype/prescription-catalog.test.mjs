import assert from "node:assert/strict";
import test from "node:test";

import { findApprovedPrescriptionCandidates } from "../../src/application/prescription-catalog.mjs";

test("blocked or incomplete safety states never expose approved candidates", async () => {
  assert.deepEqual(await findApprovedPrescriptionCandidates({ modules: ["M01"], functionalLevel: "F2", safetyStatus: "safety_blocked" }), []);
  assert.deepEqual(await findApprovedPrescriptionCandidates({ modules: ["M01"], functionalLevel: "F2", safetyStatus: "needs_information" }), []);
});

test("approved library matches both module and therapist-confirmed functional level", async () => {
  const candidates = await findApprovedPrescriptionCandidates({ modules: ["M01", "M07"], functionalLevel: "F2", safetyStatus: "manual_review_required" });
  assert.deepEqual(candidates.map((item) => item.prescriptionId), ["RX-M01-BED-MULTICOMPONENT"]);
  assert.equal(candidates[0].status, "approved");
  assert.equal(candidates[0].version, "1.0.0");
  assert.equal(candidates[0].clinicalReview.status, "approved");
  assert.equal(candidates[0].clinicalReview.reviewerUserId, "therapist");
});
