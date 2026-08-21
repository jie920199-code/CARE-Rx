export function sameOriginRedirectUrl(request, path) {
  const requestOrigin = request.headers.get("origin");
  return new URL(path, requestOrigin ?? request.url);
}
