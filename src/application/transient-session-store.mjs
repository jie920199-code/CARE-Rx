import { randomUUID } from "node:crypto";
import { SafeFailure } from "../domain/errors.mjs";

export class TransientSessionStore {
  #sessions = new Map();
  #clock;
  #idleTimeoutMs;
  #absoluteTimeoutMs;

  constructor({ clock = () => Date.now(), idleTimeoutMs = 15 * 60_000, absoluteTimeoutMs = 120 * 60_000 } = {}) {
    if (idleTimeoutMs <= 0 || absoluteTimeoutMs <= 0 || idleTimeoutMs > absoluteTimeoutMs) {
      throw new SafeFailure("SESSION_POLICY_INVALID", "Session timeouts are invalid.");
    }
    this.#clock = clock;
    this.#idleTimeoutMs = idleTimeoutMs;
    this.#absoluteTimeoutMs = absoluteTimeoutMs;
  }

  create({ therapistUserId, patientPayload }) {
    if (!therapistUserId || patientPayload === undefined) {
      throw new SafeFailure("SESSION_INPUT_INVALID", "Therapist and transient patient payload are required.");
    }
    const now = this.#clock();
    const sessionId = `SES-${randomUUID().toUpperCase()}`;
    this.#sessions.set(sessionId, {
      sessionId,
      therapistUserId,
      patientPayload: structuredClone(patientPayload),
      createdAt: now,
      lastAccessedAt: now,
      therapistConfirmed: false,
    });
    return sessionId;
  }

  get(sessionId) {
    const session = this.#requireActive(sessionId);
    session.lastAccessedAt = this.#clock();
    return Object.freeze({
      sessionId: session.sessionId,
      therapistUserId: session.therapistUserId,
      patientPayload: structuredClone(session.patientPayload),
      therapistConfirmed: session.therapistConfirmed,
    });
  }

  confirm(sessionId, therapistUserId) {
    const session = this.#requireActive(sessionId);
    if (session.therapistUserId !== therapistUserId) {
      throw new SafeFailure("SESSION_THERAPIST_MISMATCH", "Only the owning therapist can confirm this session.");
    }
    session.therapistConfirmed = true;
    session.lastAccessedAt = this.#clock();
  }

  clear(sessionId) {
    return this.#sessions.delete(sessionId);
  }

  sweepExpired() {
    let cleared = 0;
    for (const sessionId of this.#sessions.keys()) {
      try {
        this.#requireActive(sessionId);
      } catch (error) {
        if (error instanceof SafeFailure && error.code === "SESSION_EXPIRED") {
          cleared += 1;
        } else {
          throw error;
        }
      }
    }
    return cleared;
  }

  get activeCount() {
    return this.#sessions.size;
  }

  #requireActive(sessionId) {
    const session = this.#sessions.get(sessionId);
    if (!session) {
      throw new SafeFailure("SESSION_NOT_FOUND", "Session does not exist or has been cleared.");
    }
    const now = this.#clock();
    const idleExpired = now - session.lastAccessedAt >= this.#idleTimeoutMs;
    const absoluteExpired = now - session.createdAt >= this.#absoluteTimeoutMs;
    if (idleExpired || absoluteExpired) {
      this.#sessions.delete(sessionId);
      throw new SafeFailure("SESSION_EXPIRED", "Session expired and patient payload was cleared.");
    }
    return session;
  }
}
