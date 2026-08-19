# 数据字典与初步数据模型

> 这是逻辑模型，不是最终 Prisma Schema。临床枚举和必填条件待临床审核。首版采用无患者留存模式，患者相关实体只存在于短期会话和导出文件中，不写入数据库。

## 1. 核心实体

| 实体 | 关键字段 | 说明 |
|---|---|---|
| SessionSubject | ephemeralId, minimalDemographics | 会话内临时对象，不收集姓名、证件号和联系方式，不持久化 |
| Assessment | id, residentId, type, performedAt, assessorId, schemaVersion, status | 一次不可变评估快照 |
| AssessmentResponse | assessmentId, itemId, value, unit, source, observedAt | 结构化答案，不依赖自由文本 |
| SafetyScreen | assessmentId, itemResults, outcome, actions, resolvedAt/by | 逐项红旗及处置 |
| FunctionalClassification | assessmentId, level(F0-F5), rationaleCodes, provisional | 分级结论与证据 |
| FunctionalProblem | assessmentId, moduleId, role(primary/secondary), severity | M01–M10 问题记录 |
| CareContext | assessmentId, staffing, equipment, environment, availability | 照护资源约束 |
| PrescriptionDefinition | prescriptionId, version, status, clinical fields | 版本化标准处方模板 |
| DecisionRuleSet | ruleSetId, version, status, effectiveAt | 版本化规则集合 |
| RecommendationRun | assessmentSnapshotId, versions, inputsHash, outcome | 可重复的匹配执行记录 |
| PrescriptionPlan | id, runId, status, primaryGoalMode, secondaryGoalModes, confirmedBy | 会话内治疗师确认实例；目标模式允许多选 |
| PlanItem | planId, definitionVersion, overrides, overrideReason | 引用模板并保存经审修改 |
| RoleViewSnapshot | planId, audience, contentVersion, generatedAt | 会话内生成三类视图，导出后随会话清除 |
| ExportArtifact | planId, audience, versions, confirmedBy, generatedAt | 会话内生成后交由用户保存，系统不留患者副本 |
| ExecutionRecord | planItemId, scheduledAt, result, doseCompleted, symptoms, recorder | 持久化扩展实体，首版不实现 |
| Reassessment | id, baselineId, performedAt, measures, decision, rationale | 持久化扩展实体，首版不实现 |
| AuditEvent | actor, action, entityType, nonPatientMetadata, timestamp | 仅保存登录、内容发布等非患者事件；不得含输入值或处方内容 |

## 2. 处方定义必需字段

`prescriptionId`, `version`, `status`, `applicableModules`, `applicableFunctionalLevels`, `goals`, `trainingName`, `startPosition`, `steps`, `dose`（repetitions/sets/duration/frequency/intensity 及单位）, `equipment`, `assistanceLevel`, `executorRoles`, `contraindications`, `precautions`, `terminationCriteria`, `progressionCriteria`, `regressionCriteria`, `alternatives`, `reassessmentMeasures`, `evidenceSources`, `review`（reviewer/date/status）。

自由文本显示内容与可执行条件分开保存；例如终止标准应有稳定代码和参数，不能只写一句说明。

## 3. 决策规则模型

```json
{
  "ruleId": "RULE-M01-EXAMPLE",
  "version": "0.1.0-draft",
  "status": "draft",
  "priority": 100,
  "scope": ["M01"],
  "when": { "all": [{ "fact": "functionalLevel", "operator": "in", "value": ["F1", "F2"] }] },
  "then": [{ "action": "includeCandidate", "prescriptionRef": "PENDING_CLINICAL_REVIEW" }],
  "rationaleCode": "PENDING_CLINICAL_REVIEW",
  "clinicalReview": { "status": "pending" },
  "tests": ["TC-M01-PENDING"]
}
```

允许的事实、运算符和动作采用白名单；规则不能执行任意代码。发布版本必须带审批记录、变更说明、有效期和测试引用。

## 4. 评估记录模型

评估保存 `schemaVersion`、逐项答案、单位、缺失原因、信息来源、时间和评估者；计算结果保存使用的算法/规则版本及理由代码。评估签名后不可原地修改，只能作废并新建修订。

建议安全项与功能项分域；关键字段缺失规则由 Schema 明确，而不是由页面临时判断。

## 5. 复评记录模型（持久化扩展）

复评引用基线评估和当前处方，记录计划内外事件、实际执行量、指标变化、最小可解释变化规则（待临床审核）、照护环境变化及最终决策。复评窗口是计划字段，不应硬编码为固定 14 或 28 天。

## 6. 版本与时间

- 临床内容使用稳定 ID + 语义版本 + 生命周期状态：`draft/review/approved/retired`。
- 业务记录保存 UTC 时间戳并记录机构时区；显示时转换为本地时间。
- 导出处方引用精确内容版本并把版本元数据固化在文件中；系统不保存患者级历史快照。

## 7. 无患者留存约束

- 禁止将评估请求体、匹配结果、导出内容或自由文本写入数据库、访问日志、错误日志、分析平台或备份。
- 会话仅使用随机临时 ID；不得收集姓名、身份证号、联系方式、住址或病历号。
- 导出文件必须提示“由机构负责安全保存”，并包含规则版本、处方库版本、治疗师确认人、生成时间和临床决策支持免责声明。
- 浏览器刷新恢复、跨设备继续和历史查询在无留存模式下不提供。
