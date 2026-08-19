import assert from "node:assert/strict";
import test from "node:test";

import { SafeFailure } from "../../src/domain/errors.mjs";
import { assertExportAllowed } from "../../src/application/export-guard.mjs";

const session = Object.freeze({
  therapistUserId: "THERAPIST-TEST",
  therapistConfirmed: true,
});

const approvedFixture = Object.freeze({
  prescriptionId: "RX-TEST-FIXTURE",
  version: "0.0.0-test",
  status: "approved",
  clinicalReview: { status: "approved" },
});

test("unconfirmed session cannot export", () => {
  assert.throws(
    () => assertExportAllowed({
      session: { ...session, therapistConfirmed: false },
      safetyStatus: "eligible_for_matching",
      prescriptions: [approvedFixture],
      audience: "caregiver",
    }),
    (error) => error instanceof SafeFailure && error.code === "THERAPIST_CONFIRMATION_REQUIRED",
  );
});

test("blocked safety status cannot export", () => {
  assert.throws(
    () => assertExportAllowed({
      session,
      safetyStatus: "safety_blocked",
      prescriptions: [approvedFixture],
      audience: "caregiver",
    }),
    (error) => error instanceof SafeFailure && error.code === "SAFETY_STATUS_NOT_ELIGIBLE",
  );
});

test("unapproved content cannot export", () => {
  assert.throws(
    () => assertExportAllowed({
      session,
      safetyStatus: "eligible_for_matching",
      prescriptions: [{ ...approvedFixture, status: "draft", clinicalReview: { status: "pending_clinical_review" } }],
      audience: "caregiver",
    }),
    (error) => error instanceof SafeFailure && error.code === "CLINICAL_CONTENT_NOT_APPROVED",
  );
});

test("approved test fixture returns version metadata only", () => {
  const result = assertExportAllowed({
    session,
    safetyStatus: "eligible_for_matching",
    prescriptions: [approvedFixture],
    audience: "therapist",
  });

  assert.deepEqual(result, {
    allowed: true,
    audience: "therapist",
    therapistUserId: "THERAPIST-TEST",
    prescriptionVersions: ["RX-TEST-FIXTURE@0.0.0-test"],
  });
  assert.equal(Object.hasOwn(result, "renderedContent"), false);
});
