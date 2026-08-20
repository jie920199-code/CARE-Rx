const REQUIRED_SAFETY_ITEMS = Object.freeze(["acuteNeurologicalChange", "medicalInstability", "newSevereSymptom"]);

export function evaluateAssessmentSafety(responses) {
  const values = REQUIRED_SAFETY_ITEMS.map((item) => responses?.[item]);
  if (values.some((value) => !["yes", "no", "unknown"].includes(value))) {
    return Object.freeze({ status: "needs_information", prescriptionMatchingAllowed: false });
  }
  if (values.includes("yes")) return Object.freeze({ status: "safety_blocked", prescriptionMatchingAllowed: false });
  if (values.includes("unknown")) return Object.freeze({ status: "needs_information", prescriptionMatchingAllowed: false });
  return Object.freeze({ status: "manual_review_required", prescriptionMatchingAllowed: false });
}
