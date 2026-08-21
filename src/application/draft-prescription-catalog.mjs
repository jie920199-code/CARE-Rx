import { readFile } from "node:fs/promises";
import { join } from "node:path";

const DRAFT_FILES = [
  "RX-M01-BED-MULTICOMPONENT.draft.json",
  "RX-M07-GRADED-ACTIVITY.draft.json",
  "RX-M08-TASK-PRACTICE.draft.json",
];

export async function findDraftPrescriptionCandidates({ modules, functionalLevel, safetyStatus }) {
  if (safetyStatus !== "manual_review_required") return [];
  const prescriptions = await Promise.all(DRAFT_FILES.map(async (name) => JSON.parse(await readFile(join(process.cwd(), "clinical-data", "prescriptions", name), "utf8"))));
  return prescriptions.filter((item) => item.status === "draft" && item.clinicalReview.status === "pending_clinical_review" && item.applicableModules.some((moduleId) => modules.includes(moduleId)) && item.applicableFunctionalLevels.includes(functionalLevel)).map((item) => Object.freeze({ ...item, executable: false, exportAllowed: false }));
}
