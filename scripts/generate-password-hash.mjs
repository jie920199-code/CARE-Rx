import { hashPassword } from "../src/security/password.mjs";

let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
}

const password = input.replace(/\r?\n$/, "");
if (!password) {
  console.error("请通过标准输入提供密码；密码不会写入项目文件。");
  process.exitCode = 1;
} else {
  const encoded = await hashPassword(password);
  console.log(encoded.replaceAll("$", "\\$"));
}
