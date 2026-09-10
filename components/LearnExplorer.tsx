"use client";

import { useMemo, useState } from "react";
import { DOMAINS, type DomainKey } from "@/data/domains";
import type { ArticleMeta } from "@/lib/content";
import ArticleCard from "@/components/ArticleCard";

type Filter = "all" | DomainKey;

export default function LearnExplorer({
  articles,
  initialFilter,
}: {
  articles: ArticleMeta[];
  initialFilter?: string;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>(
    (["all", ...DOMAINS.map((d) => d.key)].includes(initialFilter as Filter)
      ? (initialFilter as Filter)
      : "all")
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return articles.filter((a) => {
      if (filter !== "all" && a.domain !== filter) return false;
      if (!kw) return true;
      return `${a.title} ${a.description} ${a.tags.join(" ")}`.toLowerCase().includes(kw);
    });
  }, [articles, q, filter]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题 / 描述 / 标签…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 lg:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs transition ${
              filter === "all"
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300"
            }`}
          >
            全部
          </button>
          {DOMAINS.map((d) => (
            <button
              key={d.key}
              onClick={() => setFilter(d.key)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                filter === d.key
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300"
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          没有匹配的内容，换个关键词或分类试试。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
