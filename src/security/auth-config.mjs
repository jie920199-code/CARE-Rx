const DEFAULT_IDLE_MINUTES = 15;
const DEFAULT_ABSOLUTE_MINUTES = 120;

function parseMinutes(value, fallback, minimum, maximum) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) return null;
  return parsed;
}

export function loadAuthConfig(env = process.env) {
  const username = env.CARE_RX_THERAPIST_USERNAME?.trim();
  const passwordHash = env.CARE_RX_THERAPIST_PASSWORD_HASH?.trim();
  const idleMinutes = parseMinutes(env.CARE_RX_SESSION_IDLE_MINUTES, DEFAULT_IDLE_MINUTES, 5, 60);
  const absoluteMinutes = parseMinutes(env.CARE_RX_SESSION_ABSOLUTE_MINUTES, DEFAULT_ABSOLUTE_MINUTES, 15, 480);
  const secureCookie = env.CARE_RX_COOKIE_SECURE !== "false";
  const configured = Boolean(username && passwordHash && idleMinutes && absoluteMinutes && idleMinutes <= absoluteMinutes);

  return Object.freeze({
    configured,
    username: username ?? "",
    passwordHash: passwordHash ?? "",
    secureCookie,
    idleTimeoutMs: configured ? idleMinutes * 60_000 : 0,
    absoluteTimeoutMs: configured ? absoluteMinutes * 60_000 : 0,
  });
}
