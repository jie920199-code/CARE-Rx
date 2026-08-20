# 网页登录与临时会话

状态：技术方案草案；不代表系统已获准用于临床。

## 首版范围

首版只配置一名治疗师账号，由当前唯一维护者管理。系统不提供在线注册、邀请、找回密码或多角色管理。登录用于保护评估入口，不改变“所有处方必须由治疗师审核签发”的临床安全要求。

## 安全设计

- 用户名及密码的 `scrypt` 哈希只通过服务器环境变量提供，不进入 Git。
- 浏览器仅保存随机、不透明的会话令牌；服务端内存只保存令牌摘要。
- Cookie 使用 `HttpOnly`、`SameSite=Strict` 和整站路径；局域网正式部署必须启用 HTTPS 与 `Secure`。
- 登录和退出请求必须同源；登录失败使用统一提示，避免泄露账号是否存在。
- 单进程内按客户端限制登录尝试；连续尝试超过限制后，在时间窗结束前拒绝登录。
- 会话同时受空闲超时和绝对超时约束；服务器重启会使全部会话失效。

## 本地配置

复制 `.env.example` 为 `.env.local`，只在部署电脑上填写。`.env.local` 已被 Git 忽略。

使用 PowerShell 安全读取密码并生成哈希：

```powershell
$secret = Read-Host -AsSecureString "设置治疗师密码"
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  $plainPassword | node scripts/generate-password-hash.mjs
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  Remove-Variable plainPassword -ErrorAction SilentlyContinue
}
```

把工具输出原样填写到 `CARE_RX_THERAPIST_PASSWORD_HASH`。输出中的 `\$` 是 `.env.local` 必需的转义符，不要删除。密码至少 12 个字符，建议采用更长的唯一口令。用户名填写到 `CARE_RX_THERAPIST_USERNAME`。

`CARE_RX_COOKIE_SECURE=false` 只允许在隔离的本机 HTTP 开发环境临时使用。局域网内的平板和手机访问必须通过可信 HTTPS 入口，并保持该值为 `true`。

## 数据边界

当前登录会话仅保存在运行进程内。尚未启用患者资料保存、患者历史记录、审计数据库或云同步；当前工作台也不开放患者评估录入。不得把真实患者信息输入原型系统。

处方导出将在后续阶段单独设计。导出必须经过治疗师审核，并包含规则版本、处方库版本、生成及审核信息；下载文件的保存、清理与访问控制属于部署方责任。

## 已知限制

- 内存限流和会话只适用于单个 Node.js 进程，不支持多实例或负载均衡。
- 环境变量更新后需要重启服务，现阶段没有账号管理界面。
- 尚未完成局域网 HTTPS、反向代理、设备信任和 Windows 开机自启动部署验证。
- 未保存业务数据并不等于完全无痕：部署层仍须禁止记录表单内容、Cookie 或敏感请求体。
