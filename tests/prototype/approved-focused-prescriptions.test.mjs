import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const fileName = "focused-variants.v1.0.0.approved.json";

test("therapist-approved focused prescriptions are immutable, audited and synced to mobile", async () => {
  const canonical = JSON.parse(await readFile(join(process.cwd(), "clinical-data", "prescriptions", fileName), "utf8"));
  const mobile = JSON.parse(await readFile(join(process.cwd(), "mobile-site", "clinical-data", "prescriptions", fileName), "utf8"));

  assert.deepEqual(mobile, canonical);
  assert.equal(canonical.version, "1.0.0");
  assert.equal(canonical.status, "approved");
  assert.equal(canonical.clinicalReview.status, "approved");
  assert.equal(canonical.clinicalReview.reviewerUserId, "therapist");
  assert.equal(canonical.prescriptions.length, 8);

  for (const item of canonical.prescriptions) {
    assert.equal(item.version, "1.0.0");
    assert.equal(item.status, "approved");
    assert.equal(item.sourcePrescriptionVersion, "1.0.0");
    assert.ok(item.sourcePrescriptionId);
    assert.ok(item.stepIndexes.length > 0);
    assert.ok(["core", "auxiliary", "alternative"].includes(item.focusRole));
  }
});

test("mobile runtime materializes inherited clinical fields and confirms only one prescription", async () => {
  const page = await readFile(join(process.cwd(), "mobile-site", "app", "page.tsx"), "utf8");
  const assessment = await readFile(join(process.cwd(), "mobile-site", "app", "mobile-assessment.tsx"), "utf8");
  const styles = await readFile(join(process.cwd(), "mobile-site", "app", "review-zone.css"), "utf8");

  assert.match(page, /focused-variants\.v1\.0\.0\.approved\.json/);
  assert.match(page, /sourcePrescriptionVersion/);
  assert.match(page, /steps: variant\.stepIndexes/);
  assert.match(assessment, /item\.clinicalReview\?\.status === "approved"/);
  assert.match(assessment, /confirmedId === rx\.prescriptionId/);
  assert.match(styles, /\.unconfirmed-prescription/);
});
