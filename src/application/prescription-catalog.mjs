import { readFile } from "node:fs/promises";
import { join } from "node:path";

const APPROVED_FILES = [
  "RX-M01-BED-MULTICOMPONENT.approved.json",
  "RX-M07-GRADED-ACTIVITY.approved.json",
  "RX-M08-TASK-PRACTICE.approved.json",
];

export async function findApprovedPrescriptionCandidates({ modules, functionalLevel, safetyStatus }) {
  if (safetyStatus !== "manual_review_required") return [];
  const prescriptions = await Promise.all(APPROVED_FILES.map(async (name) => JSON.parse(await readFile(join(process.cwd(), "clinical-data", "prescriptions", name), "utf8"))));
  return prescriptions
    .filter((item) => item.status === "approved" && item.clinicalReview.status === "approved" && item.applicableModules.some((moduleId) => modules.includes(moduleId)) && item.applicableFunctionalLevels.includes(functionalLevel))
    .map((item) => Object.freeze({ ...item, executable: false, exportAllowed: false, requiresCaseConfirmation: true }));
}
