"use client";
import { useMemo, useState } from "react";

type Prescription = any;
const modules = [["M01", "长期卧床与废用"], ["M07", "慢性腰痛"], ["M08", "脑卒中运动功能障碍"]];
const levels = [
  { id: "F0", name: "舒适照护级", description: "医学不稳定、终末期或无法主动参与。" },
  { id: "F1", name: "完全卧床级", description: "翻身和坐起完全依赖。" },
  { id: "F2", name: "床上活动级", description: "可以参与翻身或短时间坐起。" },
  { id: "F3", name: "转移站立级", description: "能够坐位，需要辅助站立或转移。" },
  { id: "F4", name: "辅助步行级", description: "可以在辅助或监护下行走。" },
  { id: "F5", name: "独立活动级", description: "可以独立步行或完成主要活动。" },
];
const assistance = [
  { id: "A0", name: "独立完成", description: "无需他人提示、监护或身体帮助。" },
  { id: "A1", name: "提示或监护", description: "需要口头提示或近身监护，不提供身体助力。" },
  { id: "A2", name: "一人轻度辅助", description: "一人提供少量身体帮助，老人完成主要部分。" },
  { id: "A3", name: "一人中至最大辅助", description: "一人承担较多身体帮助，必须确认操作安全。" },
  { id: "A4", name: "两人辅助", description: "需要两人共同完成并明确分工。" },
  { id: "A5", name: "机械辅助", description: "需要移位机等机械设备及受训人员。" },
  { id: "AX", name: "目前不宜实施", description: "当前条件下不执行该训练，需暂停并复核。" },
];
const goals = [["P", "预防"], ["M", "维持"], ["R", "恢复"], ["C", "代偿"], ["H", "舒适"]];
const feedbackTemplate = `CARE-Rx 公开评审反馈
机构类型（不要填写机构名称）：
测试模块：M01 / M07 / M08
虚构病例功能等级：
虚构病例辅助等级：
目标模式：
匹配结果是否合理：是 / 否 / 不确定
发现的问题：错配 / 漏配 / 剂量 / 辅助等级 / 安全措辞 / 页面操作 / 其他
具体建议（禁止包含真实患者信息）：`;

function ProposalCard({ item, parent }: { item: Prescription; parent: Prescription }) {
  const focusedSteps = item.sourceSections
    .map((reference: string) => reference.match(/^steps\[(\d+)]$/)?.[1])
    .filter((index: string | undefined) => index !== undefined)
    .map((index: string) => parent.steps[Number(index)])
    .filter(Boolean);

  return <article>
    <span>{item.role === "core" ? "核心" : item.role === "auxiliary" ? "辅助" : "替代"}</span>
    <h3>{item.title}</h3>
    <p>{item.focus}</p>
    <small>{item.prescriptionId} · 审核稿 0.1.0 · 来源 {item.sourcePrescriptionId}</small>
    <details className="proposal-details">
      <summary>查看完整审核稿</summary>
      <p className="inheritance-notice">以下剂量和安全条款继承已批准来源处方，尚未作为本重点方案独立批准。</p>
      <dl>
        <dt>适用等级</dt><dd>{item.applicableFunctionalLevels.join("、")}</dd>
        <dt>目标模式</dt><dd>{item.goalModes.join("、")}</dd>
        <dt>起始体位</dt><dd>{parent.startPosition}</dd>
        <dt>辅助范围</dt><dd>{parent.assistanceLevels.join("、")}（继承）</dd>
        <dt>剂量</dt><dd>{parent.dose.repetitions.value}；{parent.dose.sets.value}{parent.dose.sets.unit}；{parent.dose.duration.value}{parent.dose.duration.unit}；{parent.dose.frequency.value}；{parent.dose.intensity.value}（继承）</dd>
        <dt>器械</dt><dd>{parent.equipment.join("、")}</dd>
        <dt>执行人员</dt><dd>治疗师；护工执行权限待独立审核</dd>
      </dl>
      <h4>重点训练步骤</h4>
      <ol>{(focusedSteps.length ? focusedSteps : parent.steps).map((step: string) => <li key={step}>{step}</li>)}</ol>
      <h4>禁忌证</h4><ul>{parent.contraindications.map((entry: Prescription) => <li key={entry.code}>{entry.label}</li>)}</ul>
      <h4>终止标准</h4><ul>{parent.terminationCriteria.map((entry: Prescription) => <li key={entry.code}>{entry.label}</li>)}</ul>
      <h4>进阶标准</h4><ul>{parent.progressionCriteria.map((entry: Prescription) => <li key={entry.code}>{entry.label}</li>)}</ul>
      <h4>降级标准</h4><ul>{parent.regressionCriteria.map((entry: Prescription) => <li key={entry.code}>{entry.label}</li>)}</ul>
      <h4>替代训练</h4><ul>{parent.alternatives.map((entry: string) => <li key={entry}>{entry}</li>)}</ul>
      <h4>复评指标</h4><ul>{parent.reassessmentMeasures.map((entry: string) => <li key={entry}>{entry}</li>)}</ul>
    </details>
  </article>;
}

export function MobileAssessment({ prescriptions, proposals }: { prescriptions: Prescription[]; proposals: Prescription[] }) {
  const [moduleId, setModuleId] = useState("M01"); const [level, setLevel] = useState("F2"); const [assist, setAssist] = useState("A2"); const [goal, setGoal] = useState("M");
  const [safety, setSafety] = useState(["unknown", "unknown", "unknown"]); const [submitted, setSubmitted] = useState(false); const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [feedbackCopied, setFeedbackCopied] = useState(false);
  const safetyStatus = safety.includes("yes") ? "blocked" : safety.includes("unknown") ? "incomplete" : "clear";
  const matches = useMemo(() => safetyStatus === "clear" ? prescriptions.filter((item) => item.status === "approved" && item.clinicalReview?.status === "approved" && item.applicableModules.includes(moduleId) && item.applicableFunctionalLevels.includes(level) && (!item.goalModes || item.goalModes.includes(goal))) : [], [prescriptions, moduleId, level, goal, safetyStatus]);
  const proposalMatches = useMemo(() => safetyStatus === "clear" ? proposals.filter((item) => item.reviewStatus === "pending_clinical_review" && item.module === moduleId && item.applicableFunctionalLevels.includes(level) && item.goalModes.includes(goal)) : [], [proposals, moduleId, level, goal, safetyStatus]);
  const selectedLevel = levels.find((item) => item.id === level)!;
  const selectedAssistance = assistance.find((item) => item.id === assist)!;
  const reset = () => { setSubmitted(false); setConfirmedId(null); };
  function updateSafety(index: number, value: string) { setSafety((current) => current.map((item, i) => i === index ? value : item)); reset(); }

  return <main><header><div className="brand">CR</div><div><strong>CARE-Rx</strong><span>移动查房评审</span></div><em>公开评审版</em></header>
    <section className="hero"><p>CLINICAL DECISION SUPPORT</p><h1>功能分类后查看<br />批准处方</h1><div className="public-banner"><strong>面向养老机构治疗师公开测试</strong><span>仅使用虚构病例。不得输入姓名、病历、联系方式或其他可识别信息；匹配结果必须由测试治疗师独立判断，不得直接作为临床医嘱或交付护工执行。</span></div><div className="notice">页面不保存输入，不诊断疾病，不替代医生、康复医师或治疗师判断。</div></section>
    <section className="panel"><h2>1. 功能与目标分类</h2><label>核心问题<select value={moduleId} onChange={(e) => { setModuleId(e.target.value); reset(); }}>{modules.map(([id, label]) => <option key={id} value={id}>{id} · {label}</option>)}</select></label>
      <div className="two"><label>功能等级<select value={level} onChange={(e) => { setLevel(e.target.value); reset(); }}>{levels.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label><label>辅助等级<select value={assist} onChange={(e) => { setAssist(e.target.value); reset(); }}>{assistance.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label></div>
      <div className="classification-summary" aria-live="polite"><article><span>当前功能等级</span><strong>{selectedLevel.id} · {selectedLevel.name}</strong><p>{selectedLevel.description}</p></article><article><span>当前辅助等级</span><strong>{selectedAssistance.id} · {selectedAssistance.name}</strong><p>{selectedAssistance.description}</p></article></div>
      <details className="level-reference"><summary>查看全部功能与辅助等级说明</summary><div className="reference-columns"><section><h3>功能等级 F0–F5</h3>{levels.map((item) => <p className={item.id === level ? "selected-reference" : ""} key={item.id}><b>{item.id} · {item.name}</b><br />{item.description}</p>)}</section><section><h3>辅助等级 A0–AX</h3>{assistance.map((item) => <p className={item.id === assist ? "selected-reference" : ""} key={item.id}><b>{item.id} · {item.name}</b><br />{item.description}</p>)}</section></div></details>
      <label>目标模式<select value={goal} onChange={(e) => setGoal(e.target.value)}>{goals.map(([id, label]) => <option key={id} value={id}>{id} · {label}</option>)}</select></label></section>
    <section className="panel"><h2>2. 医疗安全门</h2>{["新发或突然加重的神经功能变化", "医学状态不稳定或活动未获准", "新发严重症状或近期重大变化"].map((label, index) => <fieldset key={label}><legend>{label}</legend><div className="segmented">{[["no", "否"], ["unknown", "不明确"], ["yes", "是"]].map(([value, text]) => <button type="button" className={safety[index] === value ? "active" : ""} onClick={() => updateSafety(index, value)} key={value}>{text}</button>)}</div></fieldset>)}<button className="primary" type="button" onClick={() => { setSubmitted(true); setConfirmedId(null); }}>匹配处方</button></section>
    {submitted && safetyStatus === "blocked" && <section className="result danger"><h2>安全阻断：暂停并人工复核</h2><p>不得显示或执行处方。请按机构流程判断暂停、转诊或联系医生。</p></section>}
    {submitted && safetyStatus === "incomplete" && <section className="result warning"><h2>信息不足</h2><p>补全所有安全项目并由治疗师复核前，不得继续。</p></section>}
    {submitted && safetyStatus === "clear" && matches.length === 0 && <section className="result warning"><h2>没有适用处方</h2><p>当前模块与功能等级不匹配，不得越级或改用其他处方。</p></section>}
    {submitted && matches.map((rx) => <section className={`result prescription ${confirmedId === rx.prescriptionId ? "confirmed-prescription" : "unconfirmed-prescription"}`} key={rx.prescriptionId}><p className="version">正式处方 · {rx.prescriptionId} · {rx.version}</p>{rx.focusRole && <span className={`focus-badge ${rx.focusRole}`}>{rx.focusRole === "core" ? "核心方案" : rx.focusRole === "auxiliary" ? "辅助方案" : "替代方案"}</span>}<h2>{rx.trainingName}</h2>{rx.inheritance && <p className="source-note">临床条款继承：{rx.inheritance.sourcePrescriptionId} · {rx.inheritance.sourcePrescriptionVersion}</p>}<dl><dt>本次分类</dt><dd>{moduleId} · {selectedLevel.id}（{selectedLevel.name}）· {selectedAssistance.id}（{selectedAssistance.name}）· {goal}</dd><dt>适用等级</dt><dd>{rx.applicableFunctionalLevels.join("、")}</dd><dt>辅助范围</dt><dd>{rx.assistanceLevels.join("、")}</dd><dt>起始体位</dt><dd>{rx.startPosition}</dd><dt>剂量</dt><dd>{rx.dose.repetitions.value}；{rx.dose.sets.value}组；{rx.dose.duration.value}{rx.dose.duration.unit}；{rx.dose.frequency.value}；{rx.dose.intensity.value}</dd></dl><details><summary>查看步骤、替代方案与终止标准</summary><h3>训练步骤</h3><ol>{rx.steps.map((step: string) => <li key={step}>{step}</li>)}</ol><h3>替代训练</h3><ul>{rx.alternatives.map((item: string) => <li key={item}>{item}</li>)}</ul><h3>终止标准</h3><ul>{rx.terminationCriteria.map((item: any) => <li key={item.code}>{item.label}</li>)}</ul></details>{confirmedId !== rx.prescriptionId ? <button className="primary" type="button" onClick={() => setConfirmedId(rx.prescriptionId)}>治疗师确认本次处方</button> : <div className="confirmed"><strong>本次已确认</strong><button type="button" onClick={() => window.print()}>打印 / 另存 PDF</button></div>}</section>)}
    {submitted && safetyStatus === "clear" && proposalMatches.length > 0 && <section className="result review-zone"><p className="version">待临床审核 · 不可执行</p><h2>可进一步拆分的重点方案</h2><p>以下审核稿从已批准综合处方中拆分。可查看完整字段，但尚不能确认、打印或交给护工执行。</p><div className="proposal-list">{proposalMatches.map((item) => <ProposalCard key={item.prescriptionId} item={item} parent={prescriptions.find((rx) => rx.prescriptionId === item.sourcePrescriptionId)!} />)}</div></section>}
    <section className="panel feedback-panel"><p className="version">ANONYMOUS REVIEW</p><h2>提交匿名测试反馈</h2><p>复制模板后通过 GitHub Issue 或发送给项目维护者。只描述虚构病例与系统表现，不要填写机构名称和患者信息。</p><pre>{feedbackTemplate}</pre><button className="secondary" type="button" onClick={async () => { await navigator.clipboard.writeText(feedbackTemplate); setFeedbackCopied(true); }}>{feedbackCopied ? "已复制反馈模板" : "复制匿名反馈模板"}</button><a href="https://github.com/jie920199-code/CARE-Rx/issues/new/choose" target="_blank" rel="noreferrer">前往 GitHub 提交反馈</a></section>
    <footer>CARE-Rx 公开评审原型 · 数据仅存在于当前浏览器页面内存 · 禁止输入真实患者资料</footer></main>;
}
