import type { Metadata } from "next";
import { getAllArticles } from "@/lib/content";
import JdAnalyzer, { type NoteMeta } from "@/components/JdAnalyzer";

export const metadata: Metadata = {
  title: "JD 解析 · 能力差距卡",
  description: "粘贴招聘 JD，AI 输出结构化能力差距卡，每条要求直链站内学习笔记。",
};

export default function JdPage() {
  // 注入笔记元信息（slug → {title, domain}），供客户端展示链接标题
  const notes: Record<string, NoteMeta> = {};
  for (const a of getAllArticles()) {
    notes[a.slug] = { title: a.title, domain: a.domain };
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">JD 解析 · 能力差距卡</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        粘贴一段招聘 JD，AI 会拆出结构化能力要求与预测面试题，每条都直链站内对应学习笔记——看清差距，知道补哪。
      </p>
      <JdAnalyzer notes={notes} />
    </div>
  );
}
