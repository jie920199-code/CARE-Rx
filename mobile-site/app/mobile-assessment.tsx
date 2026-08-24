"use client";
import { useMemo, useState } from "react";

type Prescription = any;
const modules = [["M01", "长期卧床与废用"], ["M07", "慢性腰痛"], ["M08", "脑卒中运动功能障碍"]];
const levels = ["F0", "F1", "F2", "F3", "F4", "F5"];
const assistance = ["A0", "A1", "A2", "A3", "A4", "A5", "AX"];
const goals = [["P", "预防"], ["M", "维持"], ["R", "恢复"], ["C", "代偿"], ["H", "舒适"]];

export function MobileAssessment({ prescriptions, proposals }: { prescriptions: Prescription[]; proposals: Prescription[] }) {
  const [moduleId, setModuleId] = useState("M01"); const [level, setLevel] = useState("F2"); const [assist, setAssist] = useState("A2"); const [goal, setGoal] = useState("M");
  const [safety, setSafety] = useState(["unknown", "unknown", "unknown"]); const [submitted, setSubmitted] = useState(false); const [confirmed, setConfirmed] = useState(false);
  const safetyStatus = safety.includes("yes") ? "blocked" : safety.includes("unknown") ? "incomplete" : "clear";
  const matches = useMemo(() => safetyStatus === "clear" ? prescriptions.filter((item) => item.status === "approved" && item.applicableModules.includes(moduleId) && item.applicableFunctionalLevels.includes(level)) : [], [prescriptions, moduleId, level, safetyStatus]);
  const proposalMatches = useMemo(() => safetyStatus === "clear" ? proposals.filter((item) => item.reviewStatus === "pending_clinical_review" && item.module === moduleId && item.applicableFunctionalLevels.includes(level) && item.goalModes.includes(goal)) : [], [proposals, moduleId, level, goal, safetyStatus]);
  const reset = () => { setSubmitted(false); setConfirmed(false); };
  function updateSafety(index: number, value: string) { setSafety((current) => current.map((item, i) => i === index ? value : item)); reset(); }

  return <main><header><div className="brand">CR</div><div><strong>CARE-Rx</strong><span>移动查房评审</span></div><em>仅限虚构病例</em></header>
    <section className="hero"><p>CLINICAL DECISION SUPPORT</p><h1>功能分类后查看<br />批准处方</h1><div className="notice">不保存输入，不诊断疾病，不替代治疗师判断。禁止输入真实患者资料。</div></section>
    <section className="panel"><h2>1. 功能与目标分类</h2><label>核心问题<select value={moduleId} onChange={(e) => { setModuleId(e.target.value); reset(); }}>{modules.map(([id, label]) => <option key={id} value={id}>{id} · {label}</option>)}</select></label>
      <div className="two"><label>功能等级<select value={level} onChange={(e) => { setLevel(e.target.value); reset(); }}>{levels.map(x => <option key={x}>{x}</option>)}</select></label><label>辅助等级<select value={assist} onChange={(e) => setAssist(e.target.value)}>{assistance.map(x => <option key={x}>{x}</option>)}</select></label></div>
      <label>目标模式<select value={goal} onChange={(e) => setGoal(e.target.value)}>{goals.map(([id, label]) => <option key={id} value={id}>{id} · {label}</option>)}</select></label></section>
    <section className="panel"><h2>2. 医疗安全门</h2>{["新发或突然加重的神经功能变化", "医学状态不稳定或活动未获准", "新发严重症状或近期重大变化"].map((label, index) => <fieldset key={label}><legend>{label}</legend><div className="segmented">{[["no", "否"], ["unknown", "不明确"], ["yes", "是"]].map(([value, text]) => <button type="button" className={safety[index] === value ? "active" : ""} onClick={() => updateSafety(index, value)} key={value}>{text}</button>)}</div></fieldset>)}<button className="primary" type="button" onClick={() => { setSubmitted(true); setConfirmed(false); }}>匹配处方</button></section>
    {submitted && safetyStatus === "blocked" && <section className="result danger"><h2>安全阻断：暂停并人工复核</h2><p>不得显示或执行处方。请按机构流程判断暂停、转诊或联系医生。</p></section>}
    {submitted && safetyStatus === "incomplete" && <section className="result warning"><h2>信息不足</h2><p>补全所有安全项目并由治疗师复核前，不得继续。</p></section>}
    {submitted && safetyStatus === "clear" && matches.length === 0 && <section className="result warning"><h2>没有适用处方</h2><p>当前模块与功能等级不匹配，不得越级或改用其他处方。</p></section>}
    {submitted && matches.map((rx) => <section className="result prescription" key={rx.prescriptionId}><p className="version">正式处方 · {rx.prescriptionId} · {rx.version}</p><h2>{rx.trainingName}</h2><dl><dt>本次分类</dt><dd>{moduleId} · {level} · {assist} · {goal}</dd><dt>适用等级</dt><dd>{rx.applicableFunctionalLevels.join("、")}</dd><dt>辅助范围</dt><dd>{rx.assistanceLevels.join("、")}</dd><dt>起始体位</dt><dd>{rx.startPosition}</dd><dt>剂量</dt><dd>{rx.dose.repetitions.value}；{rx.dose.sets.value}组；{rx.dose.duration.value}{rx.dose.duration.unit}；{rx.dose.frequency.value}；{rx.dose.intensity.value}</dd></dl><details><summary>查看步骤、替代方案与终止标准</summary><h3>训练步骤</h3><ol>{rx.steps.map((step: string) => <li key={step}>{step}</li>)}</ol><h3>替代训练</h3><ul>{rx.alternatives.map((item: string) => <li key={item}>{item}</li>)}</ul><h3>终止标准</h3><ul>{rx.terminationCriteria.map((item: any) => <li key={item.code}>{item.label}</li>)}</ul></details>{!confirmed ? <button className="primary" type="button" onClick={() => setConfirmed(true)}>治疗师确认本次处方</button> : <div className="confirmed"><strong>本次已确认</strong><button type="button" onClick={() => window.print()}>打印 / 另存 PDF</button></div>}</section>)}
    {submitted && safetyStatus === "clear" && proposalMatches.length > 0 && <section className="result review-zone"><p className="version">待临床审核 · 不可执行</p><h2>可进一步拆分的重点方案</h2><p>以下内容只从上方已批准综合处方中拆分，用于评审处方库丰富度；尚不能确认、打印或交给护工执行。</p><div className="proposal-list">{proposalMatches.map((item) => <article key={item.prescriptionId}><span>{item.role === "core" ? "核心" : item.role === "auxiliary" ? "辅助" : "替代"}</span><h3>{item.title}</h3><p>{item.focus}</p><small>{item.prescriptionId} · 剂量与安全条款暂继承 {item.sourcePrescriptionId}</small></article>)}</div></section>}
    <footer>CARE-Rx 公开评审原型 · 数据仅存在于当前浏览器页面内存</footer></main>;
}
