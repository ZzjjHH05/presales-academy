import type { Metadata } from "next";
import { getAllArticles } from "@/lib/content";
import LearnExplorer from "@/components/LearnExplorer";

export const metadata: Metadata = { title: "学习内容" };

const VALID_DOMAINS = ["industry", "tech", "core", "solutions", "soft", "job"];

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;
  const articles = getAllArticles();
  const initial = VALID_DOMAINS.includes(domain ?? "") ? domain : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">学习内容</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        按知识域浏览或搜索。全部内容以 Markdown 管理，来源与核实状态见每篇文章。
      </p>
      <LearnExplorer articles={articles} initialFilter={initial} />
    </div>
  );
}
