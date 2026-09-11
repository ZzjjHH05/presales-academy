import type { Metadata } from "next";
import { getAllArticles } from "@/lib/content";
import Workbench from "@/components/Workbench";
import type { NoteMeta } from "@/components/JdAnalyzer";

export const metadata: Metadata = {
  title: "方案工作台 · 五步法练习",
  description:
    "AI 当教练带你练写一页纸方案：澄清问题 → 五段骨架 → 逐段点评。AI 只给骨架和点评，正文必须你自己写。",
};

export default function WorkbenchPage() {
  // 注入笔记元信息（slug → {title, domain}），供客户端展示链接标题
  const notes: Record<string, NoteMeta> = {};
  for (const a of getAllArticles()) {
    notes[a.slug] = { title: a.title, domain: a.domain };
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">方案工作台 · 五步法练习</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        AI 当教练带你练「写一页纸方案」：先出澄清问题，再搭五段骨架，逐段给你点评。
        <span className="font-medium text-amber-700">
          AI 只给骨架和点评，正文必须你自己写——这是刻意设计（教练不是枪手）。
        </span>
      </p>
      <Workbench notes={notes} />
    </div>
  );
}
