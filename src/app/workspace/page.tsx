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
        <div><p className="eyebrow">SIGNED IN · MEMORY ONLY</p><h1>欢迎，{session.therapistUserId}</h1><p>可创建不留存的临时评估；禁止输入任何真实患者身份信息。</p></div>
        <div className="workspaceState"><span>当前阶段</span><strong>正式处方匹配</strong><p>已启用三份治疗师批准处方；个案确认后方可执行或导出</p></div>
      </section>
      <section className="workspaceGrid">
        <article><span className="stepTag">01</span><h2>新建临时评估</h2><p>仅限虚构病例代号；内容只保存在当前服务器内存中。</p><a className="primaryAction" href="/assessment/new">开始临时评估</a></article>
        <article><span className="stepTag">安全状态</span><h2>默认失败关闭</h2><p>红旗、信息不足或无匹配时不显示处方；处方库批准不替代本次治疗师确认。</p><a href="/">查看项目边界</a></article>
      </section>
    </main>
  );
}
