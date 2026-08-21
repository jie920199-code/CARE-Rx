# Next.js 应用骨架

## 当前能力

- Next.js App Router + React + TypeScript 的响应式页面骨架。
- 首页展示项目阶段、安全边界和受控工作流，不收集患者信息。
- `/api/health` 只返回服务状态、不可用于临床和不持久化患者数据的声明，并设置 `Cache-Control: no-store`。
- 临床数据与页面隔离；页面只读取三份 `approved@1.0.0` 处方，不能开启测试模式或执行草案规则。

## 明确禁用

- 红旗、信息不足、无匹配或未完成本次治疗师确认时，禁止执行或导出。
- 当前只支持浏览器打印或另存 PDF，不保存患者历史或导出档案。
- 没有 SQLite、Prisma、OpenAI API、遥测、分析或第三方 UI 组件库。

## 验证命令

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test:prototype
pnpm build
```

依赖均使用精确版本并提交 `pnpm-lock.yaml`。GitHub CI 必须完成冻结安装、类型检查和生产构建后，本骨架才能合并。
