import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authSessionStore } from "@/security/auth-session-store.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const cookieStore = await cookies();
  const session = authSessionStore.get(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login?error=expired");
  return (
    <main>
      <header className="topbar workspaceTopbar">
        <a className="brand" href="/"><span className="brandMark">CR</span><span><strong>CARE-Rx</strong><small>治疗师工作区</small></span></a>
        <form action="/api/auth/logout" method="post"><button className="textButton" type="submit">安全退出</button></form>
      </header>
      <section className="workspaceHero">
        <div><p className="eyebrow">SIGNED IN · MEMORY ONLY</p><h1>欢迎，{session.therapistUserId}</h1><p>身份会话仅保存在当前服务进程内。当前尚未开放患者评估录入。</p></div>
        <div className="workspaceState"><span>当前阶段</span><strong>认证骨架</strong><p>等待无患者留存评估会话完成安全审核</p></div>
      </section>
      <section className="workspaceGrid">
        <article><span className="stepTag">01</span><h2>新建临时评估</h2><p>患者信息不会建立档案，也不得写入日志或备份。</p><button type="button" disabled>暂未开放</button></article>
        <article><span className="stepTag">安全状态</span><h2>默认失败关闭</h2><p>未配置临床批准内容前，不运行草案规则、不生成处方。</p><a href="/">查看项目边界</a></article>
      </section>
    </main>
  );
}
