import assert from "node:assert/strict";
import test from "node:test";

import { SafeFailure } from "../../src/domain/errors.mjs";
import { TransientSessionStore } from "../../src/application/transient-session-store.mjs";

test("absolute timeout clears the patient payload", () => {
  let now = 0;
  const store = new TransientSessionStore({
    clock: () => now,
    idleTimeoutMs: 10_000,
    absoluteTimeoutMs: 20_000,
  });
  const sessionId = store.create({ therapistUserId: "THERAPIST-TEST", patientPayload: { synthetic: true } });

  now = 20_000;
  assert.throws(
    () => store.get(sessionId),
    (error) => error instanceof SafeFailure && error.code === "SESSION_EXPIRED",
  );
  assert.equal(store.activeCount, 0);
});

test("idle timeout clears the patient payload", () => {
  let now = 0;
  const store = new TransientSessionStore({
    clock: () => now,
    idleTimeoutMs: 5_000,
    absoluteTimeoutMs: 20_000,
  });
  const sessionId = store.create({ therapistUserId: "THERAPIST-TEST", patientPayload: { synthetic: true } });

  now = 5_000;
  assert.throws(() => store.get(sessionId), { code: "SESSION_EXPIRED" });
  assert.equal(store.activeCount, 0);
});

test("only the owning therapist can confirm a session", () => {
  const store = new TransientSessionStore();
  const sessionId = store.create({ therapistUserId: "THERAPIST-A", patientPayload: { synthetic: true } });

  assert.throws(
    () => store.confirm(sessionId, "THERAPIST-B"),
    (error) => error instanceof SafeFailure && error.code === "SESSION_THERAPIST_MISMATCH",
  );
  assert.equal(store.get(sessionId).therapistConfirmed, false);
});

test("explicit clear makes patient payload unrecoverable through the store", () => {
  const store = new TransientSessionStore();
  const sessionId = store.create({ therapistUserId: "THERAPIST-A", patientPayload: { synthetic: true } });

  assert.equal(store.clear(sessionId), true);
  assert.throws(() => store.get(sessionId), { code: "SESSION_NOT_FOUND" });
});

test("callers cannot mutate the stored patient payload through returned objects", () => {
  const store = new TransientSessionStore();
  const originalPayload = { synthetic: true, nested: { value: "original" } };
  const sessionId = store.create({ therapistUserId: "THERAPIST-A", patientPayload: originalPayload });

  originalPayload.nested.value = "changed outside";
  const firstRead = store.get(sessionId);
  firstRead.patientPayload.nested.value = "changed after read";

  assert.equal(store.get(sessionId).patientPayload.nested.value, "original");
});
