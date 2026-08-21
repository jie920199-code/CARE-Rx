import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authSessionStore } from "@/security/auth-session-store.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";
import { ModuleChoices } from "./module-choices";
import { GoalModeChoices } from "./goal-mode-choices";

const errorMessages: Record<string, string> = {
  caseAlias: "虚构病例代号格式无效，请使用 CASE- 开头，例如 CASE-DEMO-01。",
  ageBand: "请选择年龄段。",
  modules: "请至少选择一个核心问题模块。",
  functionalLevel: "请选择治疗师确认的功能等级。",
  goalModes: "请至少选择一个康复目标模式。",
  assistanceLevel: "请选择当前处方辅助等级。",
  expired: "临时评估已过期或服务器已重启，请重新填写。",
  invalid: "提交内容无效，请检查后重新填写。",
};

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const cookieStore = await cookies();
  if (!authSessionStore.get(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/login?error=expired");
  const { error } = await searchParams;
  return (
    <main className="assessmentShell">
      <header className="topbar workspaceTopbar"><a className="brand" href="/workspace"><span className="brandMark">CR</span><span><strong>CARE-Rx</strong><small>临时评估</small></span></a><a href="/workspace">返回工作区</a></header>
      <section className="assessmentIntro"><p className="eyebrow">MEMORY ONLY · NO PATIENT RECORD</p><h1>新建临时功能评估</h1><p>仅使用虚构病例代号。禁止填写姓名、身份证、联系方式、病历号或其他可识别信息。</p></section>
      {error ? <p className="formError" role="alert">{errorMessages[error] ?? errorMessages.invalid}</p> : null}
      <form action="/api/assessments" method="post" className="assessmentForm">
        <fieldset><legend>01 · 基本范围</legend><label>虚构病例代号<input name="caseAlias" required pattern="CASE-[A-Za-z0-9-]{2,24}" placeholder="例如 CASE-DEMO-01" autoComplete="off" /></label><label>年龄段<select name="ageBand" required defaultValue=""><option value="" disabled>请选择</option><option value="65-74">65～74岁</option><option value="75-84">75～84岁</option><option value="85-plus">85岁及以上</option><option value="unknown">暂不明确</option></select></label></fieldset>
        <ModuleChoices />
        <fieldset><legend>03 · 治疗师确认的功能分类</legend><label>功能等级<select name="functionalLevel" required defaultValue=""><option value="" disabled>请选择F0～F5</option><option value="F0">F0 舒适照护级</option><option value="F1">F1 完全卧床级</option><option value="F2">F2 床上活动级</option><option value="F3">F3 转移站立级</option><option value="F4">F4 辅助步行级</option><option value="F5">F5 独立活动级</option></select></label><label>当前辅助等级<select name="assistanceLevel" required defaultValue=""><option value="" disabled>请选择A0～AX</option><option value="A0">A0 独立完成</option><option value="A1">A1 口头提示或近身监护</option><option value="A2">A2 一人轻度辅助</option><option value="A3">A3 一人中度至最大辅助</option><option value="A4">A4 两人辅助</option><option value="A5">A5 机械辅助</option><option value="AX">AX 目前不适宜实施</option></select></label><p className="reviewWarning">功能等级必须由治疗师依据完整评估确认，系统不自动判级。</p></fieldset>
        <GoalModeChoices />
        <fieldset><legend>05 · 医疗安全与红旗筛查</legend><p className="reviewWarning">以下措辞均为“待临床审核”。任一“是”或“不明确”都会阻止处方候选显示。</p><SafetySelect name="acuteNeurologicalChange" label="是否存在新发或突然加重的神经功能变化？" /><SafetySelect name="medicalInstability" label="是否存在提示医学状态不稳定的情况？" /><SafetySelect name="newSevereSymptom" label="是否存在新发严重症状或近期重大变化？" /></fieldset>
        <div className="assessmentActions"><button type="submit">保存到临时会话并查看结果</button><p>提交不会生成诊断或处方，也不会写入患者数据库。</p></div>
      </form>
    </main>
  );
}

function SafetySelect({ name, label }: { name: string; label: string }) {
  return <label>{label}<select name={name} required defaultValue="unknown"><option value="unknown">不明确</option><option value="yes">是</option><option value="no">否</option></select></label>;
}
