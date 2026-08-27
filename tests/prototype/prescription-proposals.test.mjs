import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const relativePath = join("clinical-data", "prescription-proposals", "focused-variants.v0.1.0.json");

test("focused variants remain locked review proposals and mirror to mobile", async () => {
  const canonical = JSON.parse(await readFile(join(process.cwd(), relativePath), "utf8"));
  const mobile = JSON.parse(await readFile(join(process.cwd(), "mobile-site", relativePath), "utf8"));

  assert.deepEqual(mobile, canonical);
  assert.equal(canonical.status, "pending_clinical_review");
  assert.equal(canonical.generatedFromApprovedContentOnly, true);
  assert.equal(canonical.proposals.length, 12);
  assert.equal(new Set(canonical.proposals.map((item) => item.prescriptionId)).size, 12);

  for (const proposal of canonical.proposals) {
    assert.equal(proposal.reviewStatus, "pending_clinical_review");
    assert.equal(proposal.dosePolicy, "inherit_parent_without_override");
    assert.ok(proposal.sourcePrescriptionId);
    assert.ok(proposal.applicableFunctionalLevels.length > 0);
    assert.ok(proposal.goalModes.length > 0);
    assert.equal("dose" in proposal, false, "review proposals must not introduce an independent dose");
    assert.equal("clinicalReview" in proposal, false, "review proposals must not claim approval");
  }
});

test("focused variants draft a five-candidate library per module without replacing approved parents", async () => {
  const catalog = JSON.parse(await readFile(join(process.cwd(), relativePath), "utf8"));
  const proposalCounts = Object.groupBy(catalog.proposals, (item) => item.module);

  assert.equal(proposalCounts.M01.length + 1, 5);
  assert.equal(proposalCounts.M07.length + 1, 5);
  assert.equal(proposalCounts.M08.length + 1, 5);
});

test("new candidate directions remain explicitly pending clinical review", async () => {
  const catalog = JSON.parse(await readFile(join(process.cwd(), relativePath), "utf8"));
  const newIds = [
    "RX-M01-CIRCULATION-MOBILITY-FOCUS",
    "RX-M01-LOW-LOAD-STRENGTH-FOCUS",
    "RX-M07-LOAD-MANAGEMENT-FOCUS",
    "RX-M08-PROTECTED-GAIT-FOCUS",
  ];

  for (const id of newIds) {
    const proposal = catalog.proposals.find((item) => item.prescriptionId === id);
    assert.ok(proposal, `${id} is missing`);
    assert.equal(proposal.reviewStatus, "pending_clinical_review");
    assert.match(proposal.focus, /待临床审核/);
    assert.equal("dose" in proposal, false);
  }
});

test("mobile review renders inherited full fields without granting proposal confirmation", async () => {
  const source = await readFile(join(process.cwd(), "mobile-site", "app", "mobile-assessment.tsx"), "utf8");

  assert.match(source, /查看完整审核稿/);
  assert.match(source, /剂量和安全条款继承已批准来源处方/);
  assert.match(source, /parent\.contraindications/);
  assert.match(source, /parent\.terminationCriteria/);
  assert.match(source, /parent\.progressionCriteria/);
  assert.match(source, /parent\.regressionCriteria/);
  assert.match(source, /护工执行权限待独立审核/);
  assert.match(source, /parent\?\.assistanceLevels\.includes\(assist\)/);
  assert.doesNotMatch(source, /ProposalCard[\s\S]*治疗师确认本次处方[\s\S]*<\/article>/);
});
