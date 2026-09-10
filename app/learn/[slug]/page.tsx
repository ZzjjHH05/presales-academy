import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle, getAllArticles } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { DOMAIN_MAP } from "@/data/domains";
import DoneButton from "@/components/DoneButton";

function renderSource(text: string) {
  const parts = text.split(/(https?:\/\/[^\s；;，,。！？)]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-brand-600 hover:underline"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return { title: article?.meta.title ?? "文章" };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const html = await renderMarkdown(article.content);
  const d = DOMAIN_MAP[article.meta.domain];

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/learn" className="hover:text-brand-600">
          学习内容
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/learn?domain=${d.key}`} className={`${d.color} hover:underline`}>
          {d.title}
        </Link>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {article.meta.title}
        </h1>
        <p className="mt-2 text-slate-500">{article.meta.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className={`rounded-full ${d.bg} ${d.color} px-2 py-0.5 font-medium`}>
            {d.title}
          </span>
          <span>{article.meta.minutes} 分钟读完</span>
          <span>更新于 {article.meta.updated}</span>
        </div>
      </header>

      <div
        className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <p>
          <span className="font-medium text-slate-600">来源与核实：</span>
          {article.meta.source ? renderSource(article.meta.source) : "个人整理"} ·{" "}
          {article.meta.verified ? "已人工核实" : "待核实"}
        </p>
        <div className="flex gap-2">
          <DoneButton id={article.meta.slug} />
        </div>
      </footer>
    </article>
  );
}
