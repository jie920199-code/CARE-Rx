# GitHub 协作与发布流程

## 仓库策略

- 仓库保持 Private，不得为了获得免费分支保护而改为 Public。
- `main` 是稳定分支。后续变更使用 `agent/<description>` 或功能分支，通过草稿 PR 审核。
- 当前 GitHub 账号方案不支持私有仓库分支保护，因此 CI 与审核要求属于强制人工治理流程；升级 GitHub Pro 后应立即启用技术强制。

## PR 必需条件

1. 使用仓库 PR 模板完成临床安全与隐私检查。
2. `CARE-Rx safety checks` 必须成功。
3. 涉及临床内容时，必须关联临床审核 Issue 和结构化审核记录。
4. 未批准临床内容保持 `draft + pending_clinical_review`；处方保持 `AX` 且护工版为未发布。
5. 不得提交真实患者数据、数据库、日志、导出文件、密钥或环境变量。
6. 讨论和变更请求全部解决后才可合并。

## 合并方式

- 优先 Squash and merge，使每个 PR 在 `main` 上形成一个可审计提交。
- 禁止强制推送 `main`，禁止删除 `main`。
- 紧急修复也必须补充测试；不得通过放宽安全测试快速合并。

## 临床内容发布

```text
draft
  -> review（创建 clinical-review Issue）
    -> changes_required | rejected | approved
      -> 结构化审核记录
        -> CI 通过
          -> PR 合并
```

Issue 中选择“批准”本身不能把内容自动视为已批准；还必须提交精确版本的结构化审核记录，并由治疗师确认。

## 分支保护升级清单

当账号支持私有仓库分支保护后，为 `main` 启用：

- 要求 PR 才能合并。
- 至少 1 次批准，提交更新后撤销旧批准。
- 要求 `Validate clinical data and safety prototype` 状态检查通过。
- 要求讨论全部解决。
- 对管理员同样生效。
- 禁止强推和删除分支。
