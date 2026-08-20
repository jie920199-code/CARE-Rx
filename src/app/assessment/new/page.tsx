import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authSessionStore } from "@/security/auth-session-store.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

export const dynamic = "force-dynamic";

export default async function NewAssessmentPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const cookieStore = await cookies();
  if (!authSessionStore.get(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/login?error=expired");
  const { error } = await searchParams;
  return (
    <main className="assessmentShell">
      <header className="topbar workspaceTopbar"><a className="brand" href="/workspace"><span className="brandMark">CR</span><span><strong>CARE-Rx</strong><small>临时评估</small></span></a><a href="/workspace">返回工作区</a></header>
      <section className="assessmentIntro"><p className="eyebrow">MEMORY ONLY · NO PATIENT RECORD</p><h1>新建临时功能评估</h1><p>仅使用虚构病例代号。禁止填写姓名、身份证、联系方式、病历号或其他可识别信息。</p></section>
      {error ? <p className="formError" role="alert">信息不完整、已过期或格式无效，请重新填写。</p> : null}
      <form action="/api/assessments" method="post" className="assessmentForm">
        <fieldset><legend>01 · 基本范围</legend><label>虚构病例代号<input name="caseAlias" required pattern="CASE-[A-Za-z0-9-]{2,24}" placeholder="例如 CASE-DEMO-01" autoComplete="off" /></label><label>年龄段<select name="ageBand" required defaultValue=""><option value="" disabled>请选择</option><option value="65-74">65～74岁</option><option value="75-84">75～84岁</option><option value="85-plus">85岁及以上</option><option value="unknown">暂不明确</option></select></label></fieldset>
        <fieldset><legend>02 · 首版核心问题（可多选）</legend><label className="choice"><input type="checkbox" name="modules" value="M01" /> M01 长期卧床与废用综合征</label><label className="choice"><input type="checkbox" name="modules" value="M07" /> M07 慢性腰痛</label><label className="choice"><input type="checkbox" name="modules" value="M08" /> M08 脑卒中运动功能障碍</label></fieldset>
        <fieldset><legend>03 · 医疗安全与红旗筛查</legend><p className="reviewWarning">以下措辞均为“待临床审核”。任一“是”或“不明确”都会阻止处方匹配。</p><SafetySelect name="acuteNeurologicalChange" label="是否存在新发或突然加重的神经功能变化？" /><SafetySelect name="medicalInstability" label="是否存在提示医学状态不稳定的情况？" /><SafetySelect name="newSevereSymptom" label="是否存在新发严重症状或近期重大变化？" /></fieldset>
        <div className="assessmentActions"><button type="submit">保存到临时会话并查看结果</button><p>提交不会生成诊断或处方，也不会写入患者数据库。</p></div>
      </form>
    </main>
  );
}

function SafetySelect({ name, label }: { name: string; label: string }) {
  return <label>{label}<select name={name} required defaultValue="unknown"><option value="unknown">不明确</option><option value="yes">是</option><option value="no">否</option></select></label>;
}
