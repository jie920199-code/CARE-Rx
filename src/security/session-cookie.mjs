export const SESSION_COOKIE = "care_rx_session";

export function sessionCookieOptions({ secureCookie, maxAge }) {
  return Object.freeze({
    httpOnly: true,
    secure: secureCookie,
    sameSite: "strict",
    path: "/",
    maxAge,
  });
}
