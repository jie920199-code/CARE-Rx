import assert from "node:assert/strict";
import test from "node:test";

import {
  getPublicReviewSafetyStatus,
  matchApprovedPublicReviewPrescriptions,
} from "../../mobile-site/lib/public-review-matcher.mjs";

const approvedCandidate = {
  prescriptionId: "RX-TEST-FOCUS",
  status: "approved",
  clinicalReview: { status: "approved" },
  applicableModules: ["M01"],
  applicableFunctionalLevels: ["F2"],
  assistanceLevels: ["A2", "AX"],
  goalModes: ["M"],
};

test("AX blocks public-review matching even when a prescription lists AX", () => {
  const safetyStatus = getPublicReviewSafetyStatus(["no", "no", "no"], "AX");
  const matches = matchApprovedPublicReviewPrescriptions({
    prescriptions: [approvedCandidate],
    moduleId: "M01",
    functionalLevel: "F2",
    assistanceLevel: "AX",
    goalMode: "M",
    safetyStatus,
  });

  assert.equal(safetyStatus, "not_suitable");
  assert.deepEqual(matches, []);
});

test("a positive safety response has priority over AX", () => {
  assert.equal(getPublicReviewSafetyStatus(["no", "yes", "unknown"], "AX"), "blocked");
});

test("missing approved goal modes fail closed", () => {
  const candidateWithoutGoalModes = { ...approvedCandidate };
  delete candidateWithoutGoalModes.goalModes;

  const matches = matchApprovedPublicReviewPrescriptions({
    prescriptions: [candidateWithoutGoalModes],
    moduleId: "M01",
    functionalLevel: "F2",
    assistanceLevel: "A2",
    goalMode: "M",
    safetyStatus: "clear",
  });

  assert.deepEqual(matches, []);
});

test("matching requires module, function, assistance and goal and caps results", () => {
  const prescriptions = Array.from({ length: 7 }, (_, index) => ({
    ...approvedCandidate,
    prescriptionId: `RX-TEST-${index}`,
  }));

  const matches = matchApprovedPublicReviewPrescriptions({
    prescriptions,
    moduleId: "M01",
    functionalLevel: "F2",
    assistanceLevel: "A2",
    goalMode: "M",
    safetyStatus: "clear",
  });

  assert.equal(matches.length, 5);
});
