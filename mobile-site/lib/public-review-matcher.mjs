export function getPublicReviewSafetyStatus(safetyResponses, assistanceLevel) {
  if (safetyResponses.includes("yes")) return "blocked";
  if (assistanceLevel === "AX") return "not_suitable";
  if (safetyResponses.includes("unknown")) return "incomplete";
  return "clear";
}

export function matchApprovedPublicReviewPrescriptions({
  prescriptions,
  moduleId,
  functionalLevel,
  assistanceLevel,
  goalMode,
  safetyStatus,
  limit = 5,
}) {
  if (safetyStatus !== "clear" || assistanceLevel === "AX") return [];

  return prescriptions
    .filter((item) =>
      item.status === "approved" &&
      item.clinicalReview?.status === "approved" &&
      item.applicableModules.includes(moduleId) &&
      item.applicableFunctionalLevels.includes(functionalLevel) &&
      item.assistanceLevels.includes(assistanceLevel) &&
      Array.isArray(item.goalModes) &&
      item.goalModes.includes(goalMode),
    )
    .slice(0, limit);
}
