import { createHash, randomBytes } from "node:crypto";

function tokenHash(token) {
  return createHash("sha256").update(token).digest("base64url");
}

export class AuthSessionStore {
  #clock;
  #sessions = new Map();

  constructor({ clock = () => Date.now() } = {}) {
    this.#clock = clock;
  }

  create({ therapistUserId, idleTimeoutMs, absoluteTimeoutMs }) {
    if (!therapistUserId || idleTimeoutMs <= 0 || absoluteTimeoutMs <= 0 || idleTimeoutMs > absoluteTimeoutMs) {
      throw new Error("Invalid authentication session configuration.");
    }
    const now = this.#clock();
    const token = randomBytes(32).toString("base64url");
    this.#sessions.set(tokenHash(token), {
      therapistUserId,
      createdAt: now,
      lastAccessedAt: now,
      idleTimeoutMs,
      absoluteTimeoutMs,
    });
    return token;
  }

  get(token) {
    if (!token) return null;
    const key = tokenHash(token);
    const session = this.#sessions.get(key);
    if (!session) return null;
    const now = this.#clock();
    if (now - session.lastAccessedAt >= session.idleTimeoutMs || now - session.createdAt >= session.absoluteTimeoutMs) {
      this.#sessions.delete(key);
      return null;
    }
    session.lastAccessedAt = now;
    return Object.freeze({ therapistUserId: session.therapistUserId });
  }

  delete(token) {
    if (!token) return false;
    return this.#sessions.delete(tokenHash(token));
  }

  get activeCount() {
    return this.#sessions.size;
  }
}

const globalStore = globalThis.__careRxAuthSessionStore ?? new AuthSessionStore();
if (process.env.NODE_ENV !== "production") globalThis.__careRxAuthSessionStore = globalStore;
export const authSessionStore = globalStore;
