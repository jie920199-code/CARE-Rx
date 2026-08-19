# Clinical Data

此目录只保存去身份化、版本化、经 Schema 校验的临床内容源文件。

- `assessments/`：评估定义与条目，不保存患者评估结果。
- `prescriptions/`：标准处方定义及经批准的角色化文案。
- `decision-rules/`：确定性规则与理由代码。
- `schemas/`：上述内容的 JSON Schema（下一阶段建立）。

当前不放置任何未经临床审核的剂量或阈值。发布内容必须具有审批状态和测试引用。
