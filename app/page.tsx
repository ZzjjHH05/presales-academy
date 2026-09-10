import Link from "next/link";
import { DOMAINS } from "@/data/domains";
import { getAllArticles } from "@/lib/content";
import OverviewProgress from "@/components/OverviewProgress";

export default function HomePage() {
  const articles = getAllArticles();
  return (
    <div className="space-y-12">
      <section className="text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          🎯 售前 / 解决方案工程师 · 秋招专用
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold leading-snug text-slate-900 sm:text-4xl">
          把「售前岗怎么学」做成一个可用的学习站
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-500">
          市面上学习路线和面经几乎全是开发岗的。这里用一套售前能力树（六大知识域）驱动学习：
          沿路线学 → 记原创笔记 → 打卡记录进度。边学边沉淀，也是我的秋招作品展示。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/roadmap"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            开始学习路线
          </Link>
          <Link
            href="/learn"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-300"
          >
            浏览学习内容
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-medium text-brand-600">
          <Link href="/recruit" className="hover:text-brand-700">
            投递看板 →
          </Link>
          <Link href="/quiz" className="hover:text-brand-700">
            题库自测 →
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">六大知识域</h2>
          <span className="text-sm text-slate-400">已收录 {articles.length} 篇原创笔记</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((d) => (
            <Link
              key={d.key}
              href={`/learn?domain=${d.key}`}
              className={`rounded-xl border ${d.border} ${d.bg} p-4 transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{d.emoji}</span>
                <h3 className={`font-semibold ${d.color}`}>{d.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-600">{d.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">我的学习进度</h2>
        <p className="mt-1 text-sm text-slate-500">
          进度保存在本机浏览器，登录后自动同步到云端。
        </p>
        <OverviewProgress articles={articles.map((a) => a.slug)} />
      </section>
    </div>
  );
}
