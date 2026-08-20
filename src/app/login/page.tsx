import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { authSessionStore } from "@/security/auth-session-store.mjs";
import { SESSION_COOKIE } from "@/security/session-cookie.mjs";

const messages: Record<string, string> = {
  invalid: "账号或密码无效，请稍后重试。",
  unavailable: "登录尚未由机构管理员完成配置。",
  expired: "会话已过期，请重新登录。",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const cookieStore = await cookies();
  if (authSessionStore.get(cookieStore.get(SESSION_COOKIE)?.value)) redirect("/workspace");
  const { error } = await searchParams;

  return (
    <main className="authShell">
      <section className="authContext">
        <a className="brand" href="/">
          <span className="brandMark">CR</span>
          <span><strong>CARE-Rx</strong><small>功能康复决策支持</small></span>
        </a>
        <div>
          <p className="eyebrow">THERAPIST ACCESS</p>
          <h1>治疗师工作区</h1>
          <p>账号由机构管理员在本地主机配置。登录不会创建患者档案，当前评估数据仍只允许存在于短期内存会话。</p>
        </div>
        <ul className="authPromises"><li>独立治疗师账号</li><li>空闲与绝对超时</li><li>退出即清除会话</li></ul>
      </section>
      <section className="authPanel" aria-labelledby="login-title">
        <div><p className="eyebrow">SECURE SIGN IN</p><h2 id="login-title">网页登录</h2><p className="authHint">仅供已授权治疗师使用</p></div>
        {error ? <p className="formError" role="alert">{messages[error] ?? messages.invalid}</p> : null}
        <form action="/api/auth/login" method="post" className="authForm">
          <label>治疗师账号<input name="username" type="text" autoComplete="username" required maxLength={80} /></label>
          <label>密码<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
          <button type="submit">进入工作区</button>
        </form>
        <p className="privacyNote">系统不记录登录表单内容。连续失败将触发临时限速。</p>
      </section>
    </main>
  );
}
