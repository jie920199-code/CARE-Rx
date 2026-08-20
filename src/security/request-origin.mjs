export function isSameOriginRequest(request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.host === host && originUrl.protocol === requestUrl.protocol;
  } catch {
    return false;
  }
}
