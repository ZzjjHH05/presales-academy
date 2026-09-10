"use client";

import Link from "next/link";
import { DOMAINS, type DomainKey } from "@/data/domains";
import type { RoadmapNode } from "@/lib/roadmap";
import { useProgress } from "@/lib/use-progress";

export default function RoadmapView({ nodes }: { nodes: RoadmapNode[] }) {
  const { progress, toggle } = useProgress();
  const doneCount = nodes.filter((n) => progress.done[n.id]).length;

  const byDomain = (key: DomainKey) => nodes.filter((n) => n.domain === key);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
        <p className="text-sm font-medium text-brand-800">
          六大域能力树 · 已点亮 {doneCount}/{nodes.length} 个节点
        </p>
        <div className="h-2 w-44 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${nodes.length ? (doneCount / nodes.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {DOMAINS.map((d) => {
          const items = byDomain(d.key);
          if (items.length === 0) return null;
          const done = items.filter((n) => progress.done[n.id]).length;
          return (
            <section key={d.key}>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{d.emoji}</span>
                <div>
                  <h2 className="font-semibold text-slate-900">{d.title}</h2>
                  <p className="text-xs text-slate-400">
                    {d.short} · {done}/{items.length} 已完成
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((n) => {
                  const isDone = !!progress.done[n.id];
                  return (
                    <div
                      key={n.id}
                      className={`rounded-xl border p-4 transition ${
                        isDone
                          ? "border-emerald-300 bg-emerald-50/60"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-slate-900">{n.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">{n.blurb}</p>
                        </div>
                        <button
                          onClick={() => toggle(n.id)}
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                            isDone
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 text-transparent hover:border-emerald-400 hover:text-emerald-400"
                          }`}
                          aria-label={isDone ? "标记未完成" : "标记完成"}
                        >
                          ✓
                        </button>
                      </div>
                      {n.article && (
                        <Link
                          href={`/learn/${n.article}`}
                          className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          去学习 →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
