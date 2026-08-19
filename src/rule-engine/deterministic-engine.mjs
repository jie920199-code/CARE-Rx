import { SafeFailure } from "../domain/errors.mjs";

const ALLOWED_OPERATORS = new Set([
  "equals",
  "notEquals",
  "in",
  "notIn",
  "exists",
  "isUnknown",
]);

const ALLOWED_ACTIONS = new Set([
  "blockAll",
  "blockModule",
  "excludeCandidate",
  "includeCandidate",
  "requireInformation",
  "requireTherapistReview",
]);

function evaluateCondition(condition, facts) {
  if (!condition || !ALLOWED_OPERATORS.has(condition.operator)) {
    throw new SafeFailure(
      "RULE_OPERATOR_NOT_ALLOWED",
      "Rule contains an unsupported operator.",
      { operator: condition?.operator },
    );
  }

  const hasFact = Object.prototype.hasOwnProperty.call(facts, condition.fact);
  const actual = facts[condition.fact];

  switch (condition.operator) {
    case "equals":
      return hasFact && Object.is(actual, condition.value);
    case "notEquals":
      return hasFact && !Object.is(actual, condition.value);
    case "in":
      return hasFact && Array.isArray(condition.value) && condition.value.includes(actual);
    case "notIn":
      return hasFact && Array.isArray(condition.value) && !condition.value.includes(actual);
    case "exists":
      return condition.value === true ? hasFact : !hasFact;
    case "isUnknown":
      return !hasFact || actual === "unknown" || actual === "not_assessed" || actual === null;
    default:
      throw new SafeFailure("RULE_OPERATOR_NOT_ALLOWED", "Rule operator is not allowed.");
  }
}

function ruleMatches(rule, facts) {
  const group = rule.when ?? {};
  const keys = Object.keys(group);
  if (keys.length !== 1 || !["all", "any"].includes(keys[0]) || !Array.isArray(group[keys[0]])) {
    throw new SafeFailure("RULE_CONDITION_INVALID", "Rule condition group is invalid.", { ruleId: rule.ruleId });
  }
  if (group[keys[0]].length === 0) {
    throw new SafeFailure("RULE_CONDITION_EMPTY", "Rule condition group cannot be empty.", { ruleId: rule.ruleId });
  }
  return keys[0] === "all"
    ? group.all.every((condition) => evaluateCondition(condition, facts))
    : group.any.some((condition) => evaluateCondition(condition, facts));
}

function validateRule(rule, allowDraftForTesting) {
  if (!rule?.ruleId || !rule.version || !Number.isInteger(rule.priority)) {
    throw new SafeFailure("RULE_METADATA_MISSING", "Rule metadata is incomplete.", { ruleId: rule?.ruleId });
  }
  if (!Array.isArray(rule.then) || rule.then.length === 0) {
    throw new SafeFailure("RULE_ACTION_MISSING", "Rule has no action.", { ruleId: rule.ruleId });
  }
  if (!allowDraftForTesting && (rule.status !== "approved" || rule.clinicalReview?.status !== "approved")) {
    throw new SafeFailure("CLINICAL_RULE_NOT_APPROVED", "Only clinically approved rules may execute.", {
      ruleId: rule.ruleId,
      status: rule.status,
      clinicalReviewStatus: rule.clinicalReview?.status,
    });
  }
  for (const action of rule.then) {
    if (!ALLOWED_ACTIONS.has(action.action)) {
      throw new SafeFailure("RULE_ACTION_NOT_ALLOWED", "Rule action is not allowed.", {
        ruleId: rule.ruleId,
        action: action.action,
      });
    }
  }
}

export function evaluateRules({ facts, rules, allowDraftForTesting = false }) {
  if (!facts || typeof facts !== "object" || !Array.isArray(rules)) {
    throw new SafeFailure("RULE_INPUT_INVALID", "Facts and rules are required.");
  }

  const orderedRules = [...rules].sort((left, right) => right.priority - left.priority || left.ruleId.localeCompare(right.ruleId));
  const matches = [];

  for (const rule of orderedRules) {
    validateRule(rule, allowDraftForTesting);
    if (ruleMatches(rule, facts)) {
      for (const action of rule.then) {
        matches.push(Object.freeze({
          ruleId: rule.ruleId,
          ruleVersion: rule.version,
          priority: rule.priority,
          action: action.action,
          reference: action.reference ?? null,
          rationaleCode: rule.rationaleCode,
        }));
      }
    }
  }

  const hasBlockAll = matches.some((match) => match.action === "blockAll");
  const needsInformation = matches.some((match) => match.action === "requireInformation");
  const status = hasBlockAll
    ? "safety_blocked"
    : needsInformation
      ? "needs_information"
      : "eligible_for_matching";

  return Object.freeze({ status, matches: Object.freeze(matches) });
}
