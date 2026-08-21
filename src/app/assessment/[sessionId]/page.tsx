import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findApprovedPrescriptionCandidates } from "@/application/prescription-catalog.mjs";
import { transientAssessmentStore } from "@/application/transient-assessment-runtime.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";
import { PrintPrescriptionButton } from "./print-prescription-button";

const statusCopy: Record<string, { title: string; body: string }> = {
  safety_blocked: { title: "安全阻断：暂停并人工复核", body: "存在红旗肯定项。当前会话不得显示处方，应按机构流程判断暂停、转诊或联系医生。" },
  needs_information: { title: "信息不足：不得显示处方", body: "至少一项必需安全信息不明确。补充信息并由治疗师复核前，不得继续。" },
  manual_review_required: { title: "已匹配正式处方库", body: "安全筛查未发现肯定项；以下内容来自治疗师批准的版本化处方库。仍需治疗师针对本次评估确认后方可执行或导出。" },
};

export const dynamic = "force-dynamic";

export default async function AssessmentResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const cookieStore = await cookies();
  const therapist = authSessionStore.get(cookieStore.get(SESSION_COOKIE)?.value);
  if (!therapist) redirect("/login?error=expired");
  const { sessionId } = await params;
  let assessment;
  try { assessment = transientAssessmentStore.get(sessionId); } catch { redirect("/assessment/new?error=expired"); }
  if (assessment.therapistUserId !== therapist.therapistUserId) redirect("/assessment/new?error=invalid");
  const payload = assessment.patientPayload;
  const copy = statusCopy[payload.safety.status] ?? statusCopy.needs_information;
  const candidates = await findApprovedPrescriptionCandidates({ modules: payload.modules, functionalLevel: payload.functionalLevel, safetyStatus: payload.safety.status });

  return <main className="assessmentShell">
    <header className="topbar workspaceTopbar"><a className="brand" href="/workspace"><span className="brandMark">CR</span><span><strong>CARE-Rx</strong><small>临时评估结果</small></span></a><a href="/assessment/new">新建另一评估</a></header>
    <section className="resultHero"><p className="eyebrow">CLINICAL DECISION SUPPORT</p><h1>{copy.title}</h1><p>{copy.body}</p></section>
    <section className="resultGrid"><article><span>虚构病例</span><strong>{payload.caseAlias}</strong></article><article><span>功能与辅助</span><strong>{payload.functionalLevel} · {payload.assistanceLevel}</strong></article><article><span>关注模块</span><strong>{payload.modules.join(" · ")}</strong></article><article><span>目标模式</span><strong>{payload.goalModes.join(" · ")}</strong></article></section>
    {candidates.length === 0 ? <div className="reviewWarning">当前安全状态或功能等级没有可显示的批准处方。不得绕过安全门或改用未匹配处方。</div> : <section className="prescriptionList" aria-labelledby="candidate-title"><div><p className="eyebrow">APPROVED VERSIONED LIBRARY</p><h2 id="candidate-title">匹配处方</h2></div>{candidates.map((candidate) => <PrescriptionCard key={candidate.prescriptionId} candidate={candidate} confirmed={assessment.therapistConfirmed} />)}</section>}
    {candidates.length > 0 && !assessment.therapistConfirmed && <form action={`/api/assessments/${encodeURIComponent(sessionId)}/confirm`} method="post"><button className="primaryButton" type="submit">治疗师确认本次处方</button></form>}
    {assessment.therapistConfirmed && candidates.length > 0 && <div className="resultActions"><PrintPrescriptionButton /><span>本次确认仅保存在当前内存会话，关闭或过期后清除。</span></div>}
    <div className="reviewWarning">本系统提供临床决策支持，不替代医生、康复医师或治疗师判断；出现新红旗时立即停止并重新筛查。</div>
  </main>;
}

function PrescriptionCard({ candidate, confirmed }: { candidate: any; confirmed: boolean }) {
  return <article className="prescriptionCard"><div className="prescriptionHeader"><div><span>{candidate.prescriptionId} · {candidate.version}</span><h3>{candidate.trainingName}</h3></div><strong>{confirmed ? "本次已确认" : "等待本次确认"}</strong></div><dl><dt>适用等级</dt><dd>{candidate.applicableFunctionalLevels.join("、")}</dd><dt>辅助等级</dt><dd>{candidate.assistanceLevels.join("、")}</dd><dt>目标</dt><dd>{candidate.goals.join("；")}</dd><dt>起始体位</dt><dd>{candidate.startPosition}</dd><dt>批准剂量</dt><dd>{candidate.dose.repetitions.value}；{candidate.dose.sets.value}组；{candidate.dose.duration.value}{candidate.dose.duration.unit}；{candidate.dose.frequency.value}；{candidate.dose.intensity.value}</dd></dl><details open={confirmed}><summary>训练步骤、终止标准与证据</summary><h4>训练步骤</h4><ol>{candidate.steps.map((step: string) => <li key={step}>{step}</li>)}</ol><h4>终止标准</h4><ul>{candidate.terminationCriteria.map((item: any) => <li key={item.code}>{item.label}</li>)}</ul><h4>证据来源</h4><ul>{candidate.evidenceSources.map((source: any) => <li key={source.sourceId}>{source.citation}</li>)}</ul></details><p className="draftLock">{confirmed ? "状态：处方库已批准 · 本次评估已由治疗师确认 · 可打印或另存 PDF" : "状态：处方库已批准 · 本次评估尚未确认 · 不可执行或导出"}</p></article>;
}
