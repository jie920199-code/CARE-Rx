const AGE_BANDS = new Set(["65-74", "75-84", "85-plus", "unknown"]);
const MODULES = new Set(["M01", "M07", "M08"]);
const FUNCTIONAL_LEVELS = new Set(["F0", "F1", "F2", "F3", "F4", "F5"]);
const GOAL_MODES = new Set(["P", "M", "R", "C", "H"]);
const ASSISTANCE_LEVELS = new Set(["A0", "A1", "A2", "A3", "A4", "A5", "AX"]);

export function validateAssessmentInput({ caseAlias, ageBand, modules, functionalLevel, goalModes, assistanceLevel }) {
  if (!/^CASE-[A-Z0-9-]{2,24}$/.test(caseAlias)) return "caseAlias";
  if (!AGE_BANDS.has(ageBand)) return "ageBand";
  if (!Array.isArray(modules) || modules.length === 0 || modules.some((item) => !MODULES.has(item))) return "modules";
  if (!FUNCTIONAL_LEVELS.has(functionalLevel)) return "functionalLevel";
  if (!Array.isArray(goalModes) || goalModes.length === 0 || goalModes.some((item) => !GOAL_MODES.has(item))) return "goalModes";
  if (!ASSISTANCE_LEVELS.has(assistanceLevel)) return "assistanceLevel";
  return null;
}
