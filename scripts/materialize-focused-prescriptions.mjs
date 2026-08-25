import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const canonicalDir = join(root, "clinical-data", "prescriptions");
const mobileDir = join(root, "mobile-site", "clinical-data", "prescriptions");
const reviewDir = join(root, "clinical-data", "reviews");
const catalog = JSON.parse(await readFile(join(canonicalDir, "focused-variants.v1.0.0.approved.json"), "utf8"));
const parentFiles = [
  "RX-M01-BED-MULTICOMPONENT.approved.json",
  "RX-M07-GRADED-ACTIVITY.approved.json",
  "RX-M08-TASK-PRACTICE.approved.json",
];
const parents = await Promise.all(parentFiles.map(async (name) => JSON.parse(await readFile(join(canonicalDir, name), "utf8"))));

await mkdir(mobileDir, { recursive: true });
await mkdir(reviewDir, { recursive: true });

for (const variant of catalog.prescriptions) {
  const parent = parents.find((item) => item.prescriptionId === variant.sourcePrescriptionId);
  if (!parent || parent.version !== variant.sourcePrescriptionVersion) {
    throw new Error(`Approved source prescription not found for ${variant.prescriptionId}`);
  }

  const prescription = {
    ...parent,
    ...variant,
    applicableModules: [variant.module],
    steps: variant.stepIndexes.map((index) => parent.steps[index]),
    clinicalReview: catalog.clinicalReview,
    inheritance: {
      policy: catalog.inheritancePolicy,
      sourcePrescriptionId: parent.prescriptionId,
      sourcePrescriptionVersion: parent.version,
    },
  };
  const fileName = `${variant.prescriptionId}.approved.json`;
  const serialized = `${JSON.stringify(prescription, null, 2)}\n`;
  await writeFile(join(canonicalDir, fileName), serialized, "utf8");
  await writeFile(join(mobileDir, fileName), serialized, "utf8");

  const review = {
    reviewId: `REVIEW-${variant.prescriptionId}-1-0-0`,
    contentType: "prescription",
    contentId: variant.prescriptionId,
    contentVersion: variant.version,
    decision: "approved",
    checklist: {
      scopeCorrect: true,
      safetyCorrect: true,
      doseCorrectOrNotApplicable: true,
      evidenceVerified: true,
      wordingAppropriate: true,
      testsAdequate: true,
    },
    reviewerUserId: catalog.clinicalReview.reviewerUserId,
    reviewedAt: catalog.clinicalReview.reviewedAt,
    changeRequests: [],
    notes: `治疗师确认重点方案审核稿，批准继承 ${parent.prescriptionId} ${parent.version} 的剂量、辅助等级和安全条款并转为正式版本。`,
  };
  await writeFile(join(reviewDir, `${review.reviewId}.json`), `${JSON.stringify(review, null, 2)}\n`, "utf8");
}
