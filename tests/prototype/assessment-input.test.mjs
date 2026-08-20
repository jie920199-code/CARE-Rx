import assert from "node:assert/strict";
import test from "node:test";

import { validateAssessmentInput } from "../../src/application/assessment-input.mjs";

const valid = { caseAlias: "CASE-DEMO-01", ageBand: "75-84", modules: ["M01"] };

test("assessment intake identifies the first invalid field", () => {
  assert.equal(validateAssessmentInput({ ...valid, caseAlias: "张三" }), "caseAlias");
  assert.equal(validateAssessmentInput({ ...valid, ageBand: "" }), "ageBand");
  assert.equal(validateAssessmentInput({ ...valid, modules: [] }), "modules");
  assert.equal(validateAssessmentInput({ ...valid, modules: ["M99"] }), "modules");
});

test("assessment intake accepts one or more approved prototype modules", () => {
  assert.equal(validateAssessmentInput(valid), null);
  assert.equal(validateAssessmentInput({ ...valid, modules: ["M01", "M07", "M08"] }), null);
});
