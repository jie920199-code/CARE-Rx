export class LoginRateLimiter {
  #attempts = new Map();
  #clock;
  #limit;
  #windowMs;

  constructor({ clock = () => Date.now(), limit = 5, windowMs = 15 * 60_000 } = {}) {
    this.#clock = clock;
    this.#limit = limit;
    this.#windowMs = windowMs;
  }

  consume(key) {
    const now = this.#clock();
    const normalized = String(key || "unknown").toLowerCase();
    const current = this.#attempts.get(normalized);
    if (!current || now - current.startedAt >= this.#windowMs) {
      this.#attempts.set(normalized, { startedAt: now, count: 1 });
      return true;
    }
    if (current.count >= this.#limit) return false;
    current.count += 1;
    return true;
  }

  reset(key) {
    this.#attempts.delete(String(key || "unknown").toLowerCase());
  }
}

const globalLimiter = globalThis.__careRxLoginRateLimiter ?? new LoginRateLimiter();
if (process.env.NODE_ENV !== "production") globalThis.__careRxLoginRateLimiter = globalLimiter;
export const loginRateLimiter = globalLimiter;
