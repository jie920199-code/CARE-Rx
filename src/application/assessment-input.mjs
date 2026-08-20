const AGE_BANDS = new Set(["65-74", "75-84", "85-plus", "unknown"]);
const MODULES = new Set(["M01", "M07", "M08"]);

export function validateAssessmentInput({ caseAlias, ageBand, modules }) {
  if (!/^CASE-[A-Z0-9-]{2,24}$/.test(caseAlias)) return "caseAlias";
  if (!AGE_BANDS.has(ageBand)) return "ageBand";
  if (!Array.isArray(modules) || modules.length === 0 || modules.some((item) => !MODULES.has(item))) return "modules";
  return null;
}
