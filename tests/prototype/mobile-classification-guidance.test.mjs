import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

test("mobile assessment explains and highlights every functional and assistance level", async () => {
  const source = await readFile(join(process.cwd(), "mobile-site", "app", "mobile-assessment.tsx"), "utf8");

  for (const level of ["F0", "F1", "F2", "F3", "F4", "F5"]) {
    assert.match(source, new RegExp(`id: "${level}"`));
  }
  for (const level of ["A0", "A1", "A2", "A3", "A4", "A5", "AX"]) {
    assert.match(source, new RegExp(`id: "${level}"`));
  }

  assert.match(source, /当前功能等级/);
  assert.match(source, /当前辅助等级/);
  assert.match(source, /selected-reference/);
  assert.match(source, /目前不宜实施/);
});
