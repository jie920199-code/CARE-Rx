import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 32;
const DEFAULT_PARAMS = Object.freeze({ N: 16384, r: 8, p: 1 });

function parseHash(encoded) {
  const [algorithm, n, r, p, salt, digest] = String(encoded).split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !salt || !digest) return null;
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isInteger(params.N) || !Number.isInteger(params.r) || !Number.isInteger(params.p)) return null;
  if (params.N < 16384 || params.r < 8 || params.p < 1) return null;
  return { params, salt: Buffer.from(salt, "base64url"), digest: Buffer.from(digest, "base64url") };
}

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("Password must contain at least 12 characters.");
  }
  const salt = randomBytes(16);
  const digest = await scrypt(password, salt, KEY_LENGTH, { ...DEFAULT_PARAMS, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${DEFAULT_PARAMS.N}$${DEFAULT_PARAMS.r}$${DEFAULT_PARAMS.p}$${salt.toString("base64url")}$${Buffer.from(digest).toString("base64url")}`;
}

export async function verifyPassword(password, encoded) {
  const parsed = parseHash(encoded);
  if (!parsed || typeof password !== "string" || parsed.digest.length !== KEY_LENGTH) return false;
  try {
    const candidate = await scrypt(password, parsed.salt, parsed.digest.length, {
      ...parsed.params,
      maxmem: 64 * 1024 * 1024,
    });
    return timingSafeEqual(Buffer.from(candidate), parsed.digest);
  } catch {
    return false;
  }
}
