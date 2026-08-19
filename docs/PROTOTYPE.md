# 最小安全原型

## 已实现

- 零依赖、白名单运算符和白名单动作的确定性规则执行核心。
- 安全优先级：`blockAll` 高于 `requireInformation`，两者均阻止后续导出。
- 默认只允许执行 `status: approved` 且 `clinicalReview.status: approved` 的规则。
- 测试可以显式启用 `allowDraftForTesting`，该标志不得暴露给生产页面或请求参数。
- 内存临时会话，包括空闲超时、绝对超时、治疗师所有权确认和显式清除。
- 导出守卫：要求治疗师确认、安全状态允许、目标受众合法、全部处方版本已临床批准。

## 未实现

- Next.js 页面、网页登录、密码存储、Cookie、CSRF 防护和局域网 HTTPS。
- Prisma/SQLite、用户管理、内容发布和非患者审计。
- 实际 PDF/文档导出；当前只判断导出资格并返回版本元数据。
- 任何可执行临床处方。现有规则和处方仍为草案，默认运行时会拒绝它们。

## 运行测试

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\test-prototype.ps1
```

该原型用于验证安全边界，不可用于临床试点。
