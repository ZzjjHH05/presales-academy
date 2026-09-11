import type { Metadata } from "next";
import { getAllArticles } from "@/lib/content";
import InterviewSimulator, { type NoteMeta } from "@/components/InterviewSimulator";

export const metadata: Metadata = {
  title: "面试模拟 · AI 当你的面试官",
  description:
    "AI 按公司面经风格出 3 道题，你逐题作答，AI 按站内方法论逐题点评，全程记录可云同步。",
};

export default function InterviewPage() {
  // 注入笔记元信息（slug → {title, domain}），供客户端展示链接标题
  const notes: Record<string, NoteMeta> = {};
  for (const a of getAllArticles()) {
    notes[a.slug] = { title: a.title, domain: a.domain };
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">面试模拟 · AI 当你的面试官</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        选一家公司、勾选题型，AI 按该公司面经风格出 3 道题；逐题作答后按站内方法论点评，每题直链学习笔记——练完即沉淀。
      </p>
      <InterviewSimulator notes={notes} />
    </div>
  );
}
