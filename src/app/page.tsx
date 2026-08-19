const workflow = [
  "安全与红旗筛查",
  "综合功能评估",
  "F0–F5 暂定分级",
  "确定性规则匹配",
  "治疗师审核确认",
  "受控版本导出",
];

const guardrails = [
  { label: "患者数据", value: "仅当前内存会话", tone: "safe" },
  { label: "临床内容", value: "草案｜待临床审核", tone: "warning" },
  { label: "处方导出", value: "默认关闭", tone: "blocked" },
  { label: "AI生成处方", value: "禁止", tone: "blocked" },
];

export default function HomePage() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CARE-Rx 首页">
          <span className="brandMark">CR</span>
          <span>
            <strong>CARE-Rx</strong>
            <small>功能康复决策支持</small>
          </span>
        </a>
        <div className="environmentBadge">
          <span aria-hidden="true" /> 原型环境 · 不可用于临床
        </div>
      </header>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="eyebrow">FUNCTION-FIRST REHABILITATION</p>
          <h1>以功能和安全为起点，<br />让康复决策有据可循。</h1>
          <p className="lede">
            CARE-Rx 面向养老机构治疗师，以安全状态、功能等级、核心问题、康复潜力和照护条件匹配标准化候选方案。
          </p>
          <div className="heroActions">
            <button type="button" disabled>开始新评估</button>
            <a href="#safety">查看安全边界</a>
          </div>
          <p className="disabledNote">评估入口将在登录与无留存会话完成后开放。</p>
        </div>

        <aside className="statusCard" aria-label="系统状态">
          <div className="statusHeader">
            <div>
              <p>系统就绪度</p>
              <strong>安全骨架</strong>
            </div>
            <span>PHASE 2</span>
          </div>
          <div className="scoreRing" aria-label="当前只完成安全骨架">
            <div><strong>01</strong><span>/ 05</span></div>
          </div>
          <ul>
            <li className="done">确定性安全门</li>
            <li className="done">临时会话核心</li>
            <li>网页登录与权限</li>
            <li>临床内容审核</li>
          </ul>
        </aside>
      </section>

      <section className="guardrailGrid" id="safety" aria-labelledby="safety-title">
        <div className="sectionIntro">
          <p className="eyebrow">SAFETY BY DEFAULT</p>
          <h2 id="safety-title">当前安全边界</h2>
          <p>任何缺失、冲突或未批准内容均默认停止，不自动补全临床判断。</p>
        </div>
        <div className="guardrails">
          {guardrails.map((item) => (
            <article key={item.label}>
              <span className={`signal ${item.tone}`} aria-hidden="true" />
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="workflowSection" aria-labelledby="workflow-title">
        <div className="sectionIntro">
          <p className="eyebrow">CONTROLLED WORKFLOW</p>
          <h2 id="workflow-title">六步受控工作流</h2>
          <p>红旗与禁忌证始终先于分级和处方匹配，治疗师确认始终先于导出。</p>
        </div>
        <ol className="workflow">
          {workflow.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
              <small>{index < 3 ? "评估层" : index < 5 ? "决策层" : "输出层"}</small>
            </li>
          ))}
        </ol>
      </section>

      <footer>
        <p><strong>CARE-Rx</strong> 临床决策支持原型</p>
        <p>不能替代医生、康复医师或治疗师的临床判断。</p>
      </footer>
    </main>
  );
}
