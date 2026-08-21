import assert from "node:assert/strict";
import test from "node:test";

import { sameOriginRedirectUrl } from "../../src/security/request-redirect-url.mjs";

test("redirect preserves the browser origin instead of the wildcard listen address", () => {
  const request = new Request("http://0.0.0.0:3000/api/assessments/SES-TEST/confirm", {
    method: "POST",
    headers: { origin: "http://10.97.203.4:3000" },
  });
  assert.equal(
    sameOriginRedirectUrl(request, "/assessment/SES-TEST").toString(),
    "http://10.97.203.4:3000/assessment/SES-TEST",
  );
});

test("redirect falls back to request URL when Origin is absent", () => {
  const request = new Request("http://localhost:3000/api/assessments/SES-TEST/confirm", { method: "POST" });
  assert.equal(sameOriginRedirectUrl(request, "/login?error=expired").toString(), "http://localhost:3000/login?error=expired");
});
