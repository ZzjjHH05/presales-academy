"use client";

import { useProgress } from "@/lib/use-progress";

export default function OverviewProgress({ articles }: { articles: string[] }) {
  const { progress } = useProgress();
  const done = articles.filter((s) => progress.done[s]).length;
  const pct = articles.length ? Math.round((done / articles.length) * 100) : 0;
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-slate-600">
          已学文章 {done}/{articles.length}（{pct}%）
        </span>
        <span className="text-xs text-slate-400">点击路线图节点或文章内"标记为已学"</span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
