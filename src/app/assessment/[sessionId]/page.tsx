import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { transientAssessmentStore } from "@/application/transient-assessment-runtime.mjs";
import { authSessionStore } from "@/security/auth-session-store.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

const statusCopy: Record<string, { title: string; body: string }> = {
  safety_blocked: { title: "安全阻断：暂停并人工复核", body: "存在红旗肯定项。当前会话不得进入处方匹配，应由治疗师按机构流程判断是否暂停、转诊或联系医生。" },
  needs_information: { title: "信息不足：不得匹配处方", body: "至少一项必需安全信息不明确。补充信息并由治疗师复核前，不得继续。" },
  manual_review_required: { title: "必须人工复核", body: "筛查未发现肯定项，但当前临床内容仍待批准，因此不运行规则匹配、不生成处方。" },
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
  return <main className="assessmentShell"><header className="topbar workspaceTopbar"><a className="brand" href="/workspace"><span className="brandMark">CR</span><span><strong>CARE-Rx</strong><small>临时评估结果</small></span></a><a href="/assessment/new">新建另一评估</a></header><section className="resultHero"><p className="eyebrow">NO PRESCRIPTION MATCHING</p><h1>{copy.title}</h1><p>{copy.body}</p></section><section className="resultGrid"><article><span>虚构病例</span><strong>{payload.caseAlias}</strong></article><article><span>年龄段</span><strong>{payload.ageBand}</strong></article><article><span>关注模块</span><strong>{payload.modules.join(" · ")}</strong></article><article><span>数据状态</span><strong>仅当前内存会话</strong></article></section><div className="reviewWarning">当前结果不是诊断、医嘱或康复处方；所有筛查内容均待临床审核。</div></main>;
}
