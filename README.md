# CARE-Rx

[![CARE-Rx safety checks](https://github.com/jie920199-code/CARE-Rx/actions/workflows/ci.yml/badge.svg)](https://github.com/jie920199-code/CARE-Rx/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/jie920199-code/CARE-Rx?include_prereleases)](https://github.com/jie920199-code/CARE-Rx/releases)
[![Issues](https://img.shields.io/github/issues/jie920199-code/CARE-Rx)](https://github.com/jie920199-code/CARE-Rx/issues/new/choose)

面向养老机构治疗师的功能康复评估与处方临床决策支持原型。

CARE-Rx 不根据疾病名称自动开方，而是依据安全状态、F0～F5 功能等级、核心功能问题、康复目标和辅助条件，从治疗师批准的版本化处方库中进行确定性匹配。系统不诊断疾病，也不替代医生、康复医师或治疗师的临床判断。

> 当前状态：公开评审原型。移动评审页通过 HTTPS 公开访问且不留存输入，仅允许使用虚构病例；尚未完成机构级安全路径和真实临床试点审批。

公开移动评审页：[https://care-rx-mobile-review.jie920199.chatgpt.site](https://care-rx-mobile-review.jie920199.chatgpt.site)。该页面仅用于养老机构治疗师测试分类、匹配和页面可用性，不得输入真实患者信息，不得把结果直接作为临床医嘱或交付护工执行。

稳定评审快照请从 [GitHub Releases](https://github.com/jie920199-code/CARE-Rx/releases) 获取；`main` 用于持续完善。

## 可以体验什么

1. 治疗师网页登录。
2. 创建不留存的临时评估。
3. 完成红旗筛查、F0～F5、A0～AX、P/M/R/C/H 和 M01/M07/M08 分类。
4. 安全门通过后匹配正式处方库版本。
5. 治疗师针对本次评估再次确认。
6. 打印或另存 PDF；会话过期或服务重启后数据清除。

已批准处方库版本：

| 处方 ID | 模块 | 功能等级 | 版本 |
|---|---|---|---|
| `RX-M01-BED-MULTICOMPONENT` | 长期卧床与废用 | F1～F3 | `1.0.0` |
| `RX-M07-GRADED-ACTIVITY` | 慢性腰痛 | F3～F5 | `1.0.0` |
| `RX-M08-TASK-PRACTICE` | 脑卒中运动功能障碍 | F2～F4 | `1.0.0` |

处方库批准不等于对所有老人自动签发。红旗、信息不足、功能等级不匹配或缺少本次治疗师确认时，系统必须失败关闭。

## 本地运行

要求：Node.js 22、pnpm 11、Windows PowerShell。

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm auth:hash-password
pnpm dev --hostname 0.0.0.0 --port 3000
```

将密码哈希工具的输出填入 `.env.local`，开发环境使用 HTTP 时把 `CARE_RX_COOKIE_SECURE` 临时设为 `false`。不要提交 `.env.local`。

- 本机：`http://localhost:3000/login`
- 局域网：`http://<运行电脑内网地址>:3000/login`

包含账号、会话或未来患者数据的局域网应用必须配置可信 HTTPS、防火墙和机构批准的安全处置路径，不得直接开放到公网。当前公开的移动评审页是独立、无登录、无数据留存的虚构病例测试界面。

## 请同事重点评审

- 红旗问题是否充分，触发后的暂停/转诊措辞是否合适。
- F0～F5 与 A0～AX 是否容易稳定判定，边界是否清楚。
- M01、M07、M08 的适用范围、剂量、辅助等级、终止、进阶和降级标准是否合理。
- 页面是否能让治疗师快速完成分类，是否容易误操作。
- 护工或家属是否可能把提示内容误解为自动诊断或通用医嘱。
- 局域网部署、会话清除、打印和导出是否符合机构流程。

请先阅读[同事评审指南](docs/COLLEAGUE_REVIEW_GUIDE.md)，再通过 GitHub Issues 提交反馈。

## 隐私与安全

GitHub Issue、截图、提交、日志和测试中禁止出现真实患者姓名、身份证号、电话、病历、影像、照片、视频或其他可重识别信息。只允许使用虚构病例，例如 `CASE-DEMO-01`。

不要在当前公开原型中输入真实患者信息。发现安全问题时请遵循 [SECURITY.md](SECURITY.md)，不要公开披露可利用细节。

## 验证

```powershell
powershell -ExecutionPolicy Bypass -File scripts/validate-clinical-data.ps1
powershell -ExecutionPolicy Bypass -File scripts/validate-clinical-approvals.ps1
pnpm typecheck
pnpm test:prototype
pnpm build
```

GitHub Actions 会重复执行临床数据、审核记录、安全测试、类型和构建检查。

## 文档入口

- [项目章程](docs/PROJECT_CHARTER.md)
- [临床框架](docs/CLINICAL_FRAMEWORK.md)
- [安全模型](docs/SAFETY_MODEL.md)
- [临床审核记录](docs/DRAFT_PRESCRIPTION_REVIEW.md)
- [数据字典](docs/DATA_DICTIONARY.md)
- [架构建议](docs/ARCHITECTURE.md)
- [路线图](docs/ROADMAP.md)
- [测试策略](docs/TEST_STRATEGY.md)
- [局域网部署检查](docs/LAN_DEPLOYMENT_CHECKLIST.md)
- [GitHub 协作流程](docs/GITHUB_WORKFLOW.md)

## 技术结构

```text
clinical-data/  评估、处方、规则、Schema 与临床审核记录
docs/           产品、临床、安全、数据、架构和评审文档
src/            Next.js 页面、安全模块和确定性匹配逻辑
test-cases/     仅虚构或彻底匿名化的测试病例
tests/          安全、数据契约和原型回归测试
```

临床数据、规则引擎和页面代码相互分离；项目不接入 OpenAI API，也不允许 AI 自由生成治疗项目或剂量。
