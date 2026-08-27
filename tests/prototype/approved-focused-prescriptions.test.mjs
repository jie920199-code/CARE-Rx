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
  assert.equal(canonical.status, "approved_source_set");
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

    const fileName = `${item.prescriptionId}.approved.json`;
    const fullCanonical = JSON.parse(await readFile(join(process.cwd(), "clinical-data", "prescriptions", fileName), "utf8"));
    const fullMobile = JSON.parse(await readFile(join(process.cwd(), "mobile-site", "clinical-data", "prescriptions", fileName), "utf8"));
    assert.deepEqual(fullMobile, fullCanonical);
    assert.equal(fullCanonical.prescriptionId, item.prescriptionId);
    assert.equal(fullCanonical.clinicalReview.status, "approved");
    assert.equal(fullCanonical.inheritance.sourcePrescriptionVersion, "1.0.0");
  }
});

test("mobile runtime uses fail-closed matching and limits therapist review selection", async () => {
  const page = await readFile(join(process.cwd(), "mobile-site", "app", "page.tsx"), "utf8");
  const assessment = await readFile(join(process.cwd(), "mobile-site", "app", "mobile-assessment.tsx"), "utf8");
  const matcher = await readFile(join(process.cwd(), "mobile-site", "lib", "public-review-matcher.mjs"), "utf8");
  const styles = await readFile(join(process.cwd(), "mobile-site", "app", "review-zone.css"), "utf8");

  assert.match(page, /focused-variants\.v1\.0\.0\.approved\.json/);
  assert.match(page, /sourcePrescriptionVersion/);
  assert.match(page, /steps: variant\.stepIndexes/);
  assert.match(assessment, /matchApprovedPublicReviewPrescriptions/);
  assert.match(assessment, /AX 阻断：目前不宜实施/);
  assert.match(assessment, /current\.length < 3/);
  assert.match(assessment, /选择1～3个/);
  assert.match(assessment, /选择不等于临床签发/);
  assert.match(assessment, /剂量不得直接相加/);
  assert.match(matcher, /assistanceLevel === "AX"/);
  assert.match(matcher, /Array\.isArray\(item\.goalModes\)/);
  assert.match(matcher, /\.slice\(0, limit\)/);
  assert.match(styles, /\.unconfirmed-prescription/);
});
