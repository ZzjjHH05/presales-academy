import type { Metadata } from "next";
import { SOURCES } from "@/data/sources";

export const metadata: Metadata = { title: "资料库" };

export default function SourcesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">资料库 · 外部学习链接</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        从公开网络整理的真实链接，按主题分类。链接为检索所得（2026-09-04），个别可能失效或需登录，以实际页面为准；内容请自行核实后使用。
      </p>

      <div className="space-y-8">
        {SOURCES.map((cat) => (
          <section key={cat.key}>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span>{cat.emoji}</span>
              {cat.title}
              <span className="text-xs font-normal text-slate-400">
                {cat.items.length} 条
              </span>
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {cat.items.map((item) => (
                <li
                  key={item.url}
                  className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm font-medium text-brand-700 hover:underline"
                  >
                    {item.title}
                  </a>
                  {item.note && <p className="mt-1 text-xs text-slate-400">{item.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
        ⚠️ 资料库仅为学习导航：链接内容来自公开网络，准确性/时效性需自行判断，涉及具体技术参数以官方文档为准。
      </p>
    </div>
  );
}
