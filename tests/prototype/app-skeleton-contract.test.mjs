import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

test("application dependencies are exact and minimal", async () => {
  const manifest = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest.dependencies).sort(), ["next", "react", "react-dom"]);
  for (const version of Object.values({ ...manifest.dependencies, ...manifest.devDependencies })) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
  }
  assert.equal(manifest.scripts.typecheck, "tsc --noEmit");
  assert.equal(manifest.scripts.build, "next build");
});

test("prototype home page exposes no active clinical workflow", async () => {
  const page = await readFile(join(projectRoot, "src", "app", "page.tsx"), "utf8");
  assert.match(page, /不可用于临床/);
  assert.match(page, /<button type="button" disabled>/);
  assert.match(page, /草案｜待临床审核/);
  assert.doesNotMatch(page, /OpenAI|generatePrescription|allowDraftForTesting/);
});

test("app routes do not import draft clinical data or rule execution", async () => {
  const appRoot = join(projectRoot, "src", "app");
  const files = [];
  async function collect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
    }
  }
  await collect(appRoot);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /clinical-data|decision-rules|deterministic-engine|allowDraftForTesting/, file);
  }
});

test("health route declares non-clinical and non-persistent status", async () => {
  const route = await readFile(join(projectRoot, "src", "app", "api", "health", "route.ts"), "utf8");
  assert.match(route, /clinicalUseAllowed:\s*false/);
  assert.match(route, /patientPersistence:\s*false/);
  assert.match(route, /"Cache-Control":\s*"no-store"/);
});
