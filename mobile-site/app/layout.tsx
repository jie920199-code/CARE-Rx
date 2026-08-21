import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "CARE-Rx 移动查房评审", description: "养老机构功能康复评估与版本化处方临床决策支持原型" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
