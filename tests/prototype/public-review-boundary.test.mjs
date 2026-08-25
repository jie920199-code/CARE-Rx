import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

test("public mobile review prominently prohibits identifiable patient data", async () => {
  const source = await readFile(join(process.cwd(), "mobile-site", "app", "mobile-assessment.tsx"), "utf8");

  assert.match(source, /公开评审版/);
  assert.match(source, /仅使用虚构病例/);
  assert.match(source, /不得输入姓名、病历、联系方式或其他可识别信息/);
  assert.match(source, /不得直接作为临床医嘱或交付护工执行/);
  assert.match(source, /页面不保存输入/);
});

test("public feedback template requests no patient or institution identity", async () => {
  const source = await readFile(join(process.cwd(), "mobile-site", "app", "mobile-assessment.tsx"), "utf8");

  assert.match(source, /机构类型（不要填写机构名称）/);
  assert.match(source, /禁止包含真实患者信息/);
  assert.match(source, /github\.com\/jie920199-code\/CARE-Rx\/issues\/new\/choose/);
  assert.doesNotMatch(source, /患者姓名|身份证号|电话号码/);
});
