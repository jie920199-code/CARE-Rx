"use client";

import { useState } from "react";

const options = [
  ["M01", "长期卧床与废用综合征"],
  ["M07", "慢性腰痛"],
  ["M08", "脑卒中运动功能障碍"],
];

export function ModuleChoices() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (value: string, checked: boolean) => {
    setSelected((current) => checked ? [...current, value] : current.filter((item) => item !== value));
  };
  return <fieldset><legend>02 · 首版核心问题（可多选）</legend><p id="module-help" className="fieldHelp">至少选择一项（必选）</p>{options.map(([value, label]) => <label className="choice" key={value}><input type="checkbox" name="modules" value={value} checked={selected.includes(value)} required={selected.length === 0} aria-describedby="module-help" onChange={(event) => toggle(value, event.target.checked)} /> {value} {label}</label>)}</fieldset>;
}
