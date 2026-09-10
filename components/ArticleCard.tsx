import Link from "next/link";
import type { ArticleMeta } from "@/lib/content";
import { DOMAIN_MAP } from "@/data/domains";

export default function ArticleCard({ article }: { article: ArticleMeta }) {
  const d = DOMAIN_MAP[article.domain];
  return (
    <Link
      href={`/learn/${article.slug}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className={`rounded-full ${d.bg} ${d.color} px-2 py-0.5 text-xs font-medium`}>
          {d.title}
        </span>
        <span className="text-xs text-slate-400">{article.minutes} 分钟</span>
      </div>
      <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-brand-700">
        {article.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{article.description}</p>
      {article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {article.tags.map((t) => (
            <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
