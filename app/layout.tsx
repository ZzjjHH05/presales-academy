import type { Metadata } from "next";
import "./globals.css";
import "highlight.js/styles/github.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "售前学院 · 售前岗秋招学习站",
    template: "%s · 售前学院",
  },
  description:
    "面向售前/解决方案工程师岗位的学习路线与知识库：能力树、原创笔记、面经与秋招准备。",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "售前学院 · 售前岗秋招学习站",
    description:
      "面向售前/解决方案工程师岗位的学习路线与知识库：能力树、原创笔记、面经与秋招准备。",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
