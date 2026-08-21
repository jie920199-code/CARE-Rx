"use client";

import { useState } from "react";

const options = [["P", "预防型"], ["M", "维持型"], ["R", "恢复型"], ["C", "代偿型"], ["H", "舒适型"]];

export function GoalModeChoices() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (value: string, checked: boolean) => setSelected((current) => checked ? [...current, value] : current.filter((item) => item !== value));
  return <fieldset><legend>04 · 康复目标模式（可多选）</legend><p id="goal-help" className="fieldHelp">至少选择一项；系统不会强制要求进阶。</p>{options.map(([value, label]) => <label className="choice" key={value}><input type="checkbox" name="goalModes" value={value} checked={selected.includes(value)} required={selected.length === 0} aria-describedby="goal-help" onChange={(event) => toggle(value, event.target.checked)} /> {value} · {label}</label>)}</fieldset>;
}
