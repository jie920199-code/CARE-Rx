import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const names = [
  "RX-M01-BED-MULTICOMPONENT.approved.json",
  "RX-M07-GRADED-ACTIVITY.approved.json",
  "RX-M08-TASK-PRACTICE.approved.json",
];

test("mobile site prescriptions exactly match the approved canonical library", async () => {
  for (const name of names) {
    const canonical = JSON.parse(await readFile(join(process.cwd(), "clinical-data", "prescriptions", name), "utf8"));
    const mobile = JSON.parse(await readFile(join(process.cwd(), "mobile-site", "clinical-data", "prescriptions", name), "utf8"));
    assert.deepEqual(mobile, canonical, `${name} is out of sync`);
  }
});
