# CARE-Rx

面向养老机构的功能康复评估与处方临床决策支持系统（规划阶段）。

CARE-Rx 依据安全状态、功能等级、核心功能问题、康复潜力和照护条件，通过可追溯的确定性规则匹配标准处方。系统不诊断疾病，不替代临床判断；任何处方必须经康复治疗师审核、修改或确认后方可生效。

## 当前范围

- 当前里程碑：项目章程、临床框架、安全模型、数据模型、架构和路线图。
- 首版重点模块：M01 长期卧床与废用综合征、M07 慢性腰痛、M08 脑卒中运动功能障碍。
- 首版运行模式：机构局域网多终端访问；患者输入仅用于当前会话，治疗师确认后可导出，不在系统内长期保存。
- 当前明确不做：真实患者数据、OpenAI API、自由生成处方、未经审核自动签发、完整业务软件。

## 文档入口

- [项目章程](docs/PROJECT_CHARTER.md)
- [临床框架](docs/CLINICAL_FRAMEWORK.md)
- [安全模型](docs/SAFETY_MODEL.md)
- [数据字典](docs/DATA_DICTIONARY.md)
- [架构建议](docs/ARCHITECTURE.md)
- [路线图](docs/ROADMAP.md)
- [测试策略](docs/TEST_STRATEGY.md)
- [待确认问题](docs/OPEN_QUESTIONS.md)
- [已确认决策](docs/DECISIONS.md)
- [阶段1可执行规范](docs/PHASE1_SPECIFICATION.md)
- [临床内容审核清单](docs/CLINICAL_REVIEW_CHECKLIST.md)
- [局域网威胁模型](docs/THREAT_MODEL.md)
- [局域网部署检查清单](docs/LAN_DEPLOYMENT_CHECKLIST.md)
- [最小安全原型](docs/PROTOTYPE.md)

## 目录约定

```text
clinical-data/       评估定义、处方库、确定性决策规则（与 UI 分离）
docs/                可审核的产品、临床、安全、数据与架构文档
src/                 后续业务代码（本阶段为空）
test-cases/          仅虚构或彻底匿名化病例
tests/               后续自动化测试
```

所有临床阈值、剂量、禁忌证和进退阶条件在临床负责人批准前均视为“待临床审核”。
