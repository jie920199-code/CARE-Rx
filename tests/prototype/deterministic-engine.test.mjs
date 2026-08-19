import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { SafeFailure } from "../../src/domain/errors.mjs";
import { evaluateRules } from "../../src/rule-engine/deterministic-engine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..", "..");

async function loadRule(fileName) {
  return JSON.parse(await readFile(join(projectRoot, "clinical-data", "decision-rules", fileName), "utf8"));
}

test("acute change has priority and blocks all matching", async () => {
  const rules = await Promise.all([
    loadRule("global-safety.draft.json"),
    loadRule("global-acute-change-block.draft.json"),
  ]);
  const result = evaluateRules({
    facts: {
      "safetyScreen.hasUnknownRequiredItem": false,
      "safetyScreen.SF-ACUTE-NEUROLOGICAL-CHANGE": "yes",
    },
    rules,
    allowDraftForTesting: true,
  });

  assert.equal(result.status, "safety_blocked");
  assert.equal(result.matches[0].action, "blockAll");
  assert.equal(result.matches[0].rationaleCode, "SAFETY_ACUTE_CHANGE_BLOCK");
});

test("missing required safety information stops matching", async () => {
  const rule = await loadRule("global-safety.draft.json");
  const result = evaluateRules({
    facts: { "safetyScreen.hasUnknownRequiredItem": true },
    rules: [rule],
    allowDraftForTesting: true,
  });

  assert.equal(result.status, "needs_information");
  assert.deepEqual(result.matches.map((match) => match.action), ["requireInformation"]);
});

test("negative safety facts produce no rule match", async () => {
  const rules = await Promise.all([
    loadRule("global-safety.draft.json"),
    loadRule("global-acute-change-block.draft.json"),
  ]);
  const result = evaluateRules({
    facts: {
      "safetyScreen.hasUnknownRequiredItem": false,
      "safetyScreen.SF-ACUTE-NEUROLOGICAL-CHANGE": "no",
    },
    rules,
    allowDraftForTesting: true,
  });

  assert.equal(result.status, "eligible_for_matching");
  assert.equal(result.matches.length, 0);
});

test("unknown operator fails closed", () => {
  const unsafeRule = {
    ruleId: "RULE-TEST-UNSAFE",
    version: "0.0.0-test",
    priority: 1,
    when: { all: [{ fact: "x", operator: "executeCode", value: true }] },
    then: [{ action: "includeCandidate" }],
    rationaleCode: "TEST_ONLY",
  };

  assert.throws(
    () => evaluateRules({ facts: { x: true }, rules: [unsafeRule], allowDraftForTesting: true }),
    (error) => error instanceof SafeFailure && error.code === "RULE_OPERATOR_NOT_ALLOWED",
  );
});

test("unknown action fails closed", () => {
  const unsafeRule = {
    ruleId: "RULE-TEST-UNSAFE-ACTION",
    version: "0.0.0-test",
    priority: 1,
    when: { all: [{ fact: "x", operator: "equals", value: true }] },
    then: [{ action: "generatePrescriptionFreely" }],
    rationaleCode: "TEST_ONLY",
  };

  assert.throws(
    () => evaluateRules({ facts: { x: true }, rules: [unsafeRule], allowDraftForTesting: true }),
    (error) => error instanceof SafeFailure && error.code === "RULE_ACTION_NOT_ALLOWED",
  );
});

test("draft clinical rule is rejected by default", async () => {
  const draftRule = await loadRule("global-safety.draft.json");

  assert.throws(
    () => evaluateRules({
      facts: { "safetyScreen.hasUnknownRequiredItem": true },
      rules: [draftRule],
    }),
    (error) => error instanceof SafeFailure && error.code === "CLINICAL_RULE_NOT_APPROVED",
  );
});
