import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findDraftPrescriptionCandidates } from "@/application/draft-prescription-catalog.mjs";
import { transientAssessmentStore } from "@/application/transient-assessment-runtime.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

const statusCopy: Record<string, { title: string; body: string }> = {
  safety_blocked: { title: "安全阻断：暂停并人工复核", body: "存在红旗肯定项。当前会话不得显示处方候选，应由治疗师按机构流程判断是否暂停、转诊或联系医生。" },
  needs_information: { title: "信息不足：不得显示处方候选", body: "至少一项必需安全信息不明确。补充信息并由治疗师复核前，不得继续。" },
  manual_review_required: { title: "候选处方草案：等待治疗师审核", body: "安全筛查未发现肯定项；以下内容来自版本化草案库，仅供临床审核，尚不可签发、执行或导出。" },
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
  const candidates = await findDraftPrescriptionCandidates({ modules: payload.modules, functionalLevel: payload.functionalLevel, safetyStatus: payload.safety.status });

  return <main className="assessmentShell">
    <header className="topbar workspaceTopbar"><a className="brand" href="/workspace"><span className="brandMark">CR</span><span><strong>CARE-Rx</strong><small>临时评估结果</small></span></a><a href="/assessment/new">新建另一评估</a></header>
    <section className="resultHero"><p className="eyebrow">DRAFT · NOT FOR CLINICAL USE</p><h1>{copy.title}</h1><p>{copy.body}</p></section>
    <section className="resultGrid"><article><span>虚构病例</span><strong>{payload.caseAlias}</strong></article><article><span>功能与辅助</span><strong>{payload.functionalLevel} · {payload.assistanceLevel}</strong></article><article><span>关注模块</span><strong>{payload.modules.join(" · ")}</strong></article><article><span>目标模式</span><strong>{payload.goalModes.join(" · ")}</strong></article></section>
    {candidates.length === 0 ? <div className="reviewWarning">当前安全状态或功能等级没有可显示的候选草案。不得绕过安全门或改用未匹配处方。</div> : <section className="prescriptionList" aria-labelledby="candidate-title"><div><p className="eyebrow">STRUCTURED DRAFT LIBRARY</p><h2 id="candidate-title">候选处方草案</h2></div>{candidates.map((candidate) => <PrescriptionCard key={candidate.prescriptionId} candidate={candidate} />)}</section>}
    <div className="reviewWarning">所有处方均为待临床审核草案，当前不可签发、不可导出、不可交由护工执行。</div>
  </main>;
}

function PrescriptionCard({ candidate }: { candidate: any }) {
  return <article className="prescriptionCard"><div className="prescriptionHeader"><div><span>{candidate.prescriptionId} · {candidate.version}</span><h3>{candidate.trainingName}</h3></div><strong>待临床审核</strong></div><dl><dt>适用等级</dt><dd>{candidate.applicableFunctionalLevels.join("、")}</dd><dt>目标</dt><dd>{candidate.goals.join("；")}</dd><dt>起始体位</dt><dd>{candidate.startPosition}</dd><dt>建议剂量</dt><dd>{candidate.dose.repetitions.value}；{candidate.dose.sets.value}组；{candidate.dose.duration.value}{candidate.dose.duration.unit}；{candidate.dose.frequency.value}；{candidate.dose.intensity.value}</dd></dl><details><summary>查看训练步骤、终止标准与证据</summary><h4>训练步骤</h4><ol>{candidate.steps.map((step: string) => <li key={step}>{step}</li>)}</ol><h4>终止标准</h4><ul>{candidate.terminationCriteria.map((item: any) => <li key={item.code}>{item.label}</li>)}</ul><h4>证据来源</h4><ul>{candidate.evidenceSources.map((source: any) => <li key={source.sourceId}>{source.citation}</li>)}</ul></details><p className="draftLock">锁定状态：不可执行 · 不可签发 · 不可导出</p></article>;
}
