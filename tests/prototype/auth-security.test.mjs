import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { loadAuthConfig } from "../../src/security/auth-config.mjs";
import { AuthSessionStore } from "../../src/security/auth-session-store.mjs";
import { LoginRateLimiter } from "../../src/security/login-rate-limiter.mjs";
import { hashPassword, verifyPassword } from "../../src/security/password.mjs";
import { isSameOriginRequest } from "../../src/security/request-origin.mjs";
import { sessionCookieOptions } from "../../src/security/session-cookie.mjs";

test("password hashes verify without retaining plaintext", async () => {
  const password = "a-long-test-password";
  const encoded = await hashPassword(password);

  assert.match(encoded, /^scrypt\$/);
  assert.equal(encoded.includes(password), false);
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword("incorrect-password", encoded), false);
  assert.equal(await verifyPassword(password, "malformed"), false);
});

test("password hash tool emits dotenv-safe output", async () => {
  const password = "another-test-password";
  const result = spawnSync(process.execPath, ["scripts/generate-password-hash.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: `${password}\n`,
  });
  assert.equal(result.status, 0);
  const dotenvValue = result.stdout.trim();
  assert.match(dotenvValue, /^scrypt\\\$/);
  assert.equal(dotenvValue.includes("$"), true);
  assert.equal(dotenvValue.includes("\\$"), true);
  assert.equal(await verifyPassword(password, dotenvValue.replaceAll("\\$", "$")), true);
});

test("authentication configuration fails closed when credentials are absent", () => {
  const config = loadAuthConfig({});
  assert.equal(config.configured, false);
  assert.equal(config.idleTimeoutMs, 0);
  assert.equal(config.absoluteTimeoutMs, 0);
});

test("authentication configuration validates timeout bounds", () => {
  const base = {
    CARE_RX_THERAPIST_USERNAME: "therapist",
    CARE_RX_THERAPIST_PASSWORD_HASH: "scrypt$16384$8$1$salt$hash",
  };

  assert.equal(loadAuthConfig({ ...base, CARE_RX_SESSION_IDLE_MINUTES: "4" }).configured, false);
  assert.equal(loadAuthConfig({ ...base, CARE_RX_SESSION_ABSOLUTE_MINUTES: "481" }).configured, false);
});

test("sessions expire on idle timeout and absolute timeout", () => {
  let now = 1_000_000;
  const store = new AuthSessionStore({ clock: () => now });

  const idleToken = store.create({ therapistUserId: "therapist", idleTimeoutMs: 1_000, absoluteTimeoutMs: 3_000 });
  now += 1_001;
  assert.equal(store.get(idleToken), null);

  now = 2_000_000;
  const absoluteToken = store.create({ therapistUserId: "therapist", idleTimeoutMs: 1_000, absoluteTimeoutMs: 3_000 });
  now += 900;
  assert.equal(store.get(absoluteToken)?.therapistUserId, "therapist");
  now += 900;
  assert.equal(store.get(absoluteToken)?.therapistUserId, "therapist");
  now = 2_003_001;
  assert.equal(store.get(absoluteToken), null);
});

test("deleted sessions cannot be reused", () => {
  const store = new AuthSessionStore();
  const token = store.create({ therapistUserId: "therapist", idleTimeoutMs: 1_000, absoluteTimeoutMs: 2_000 });
  store.delete(token);
  assert.equal(store.get(token), null);
});

test("login limiter blocks the sixth attempt and resets after its window", () => {
  let now = 10_000;
  const limiter = new LoginRateLimiter({ limit: 5, windowMs: 1_000, clock: () => now });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(limiter.consume("client"), true);
  }
  assert.equal(limiter.consume("client"), false);
  now += 1_001;
  assert.equal(limiter.consume("client"), true);
});

test("state-changing requests require an exact same origin", () => {
  assert.equal(
    isSameOriginRequest(
      new Request("https://care-rx.local/api/auth/login", {
        headers: { host: "care-rx.local", origin: "https://care-rx.local" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOriginRequest(
      new Request("https://care-rx.local/api/auth/login", {
        headers: { host: "care-rx.local", origin: "https://attacker.invalid" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginRequest(
      new Request("http://0.0.0.0:3000/api/auth/login", {
        headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOriginRequest(
      new Request("http://0.0.0.0:3000/api/auth/login", {
        headers: { host: "localhost:3000", origin: "https://localhost:3000" },
      }),
    ),
    false,
  );
  assert.equal(isSameOriginRequest(new Request("https://care-rx.local/api/auth/login")), false);
});

test("session cookie is host-only, HTTP-only and strict same-site", () => {
  const options = sessionCookieOptions({ secureCookie: true, maxAge: 900 });
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "strict");
  assert.equal(options.path, "/");
  assert.equal("domain" in options, false);
});
