import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { DomainKey } from "@/data/domains";

export interface ArticleMeta {
  slug: string;
  domain: DomainKey;
  title: string;
  description: string;
  order: number;
  tags: string[];
  minutes: number;
  updated: string;
  source?: string;
  verified?: boolean;
}

export interface Article {
  meta: ArticleMeta;
  content: string;
}

const LEARN_DIR = path.join(process.cwd(), "content", "learn");

function fmtDate(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return typeof v === "string" ? v : "";
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function readAll(): Article[] {
  const out: Article[] = [];
  if (!fs.existsSync(LEARN_DIR)) return out;
  for (const domain of fs.readdirSync(LEARN_DIR)) {
    const dpath = path.join(LEARN_DIR, domain);
    if (!fs.statSync(dpath).isDirectory()) continue;
    for (const file of fs.readdirSync(dpath)) {
      if (!file.endsWith(".md")) continue;
      const slug = path.basename(file, ".md");
      const raw = fs.readFileSync(path.join(dpath, file), "utf8");
      const { data, content } = matter(raw);
      out.push({
        meta: {
          slug,
          domain: (data.domain as DomainKey) ?? (domain as DomainKey),
          title: str(data.title) || slug,
          description: str(data.description),
          order: typeof data.order === "number" ? data.order : 999,
          tags: Array.isArray(data.tags) ? data.tags.filter((t) => typeof t === "string") : [],
          minutes: typeof data.minutes === "number" ? data.minutes : 5,
          updated: fmtDate(data.updated),
          source: str(data.source) || undefined,
          verified: typeof data.verified === "boolean" ? data.verified : undefined,
        },
        content,
      });
    }
  }
  return out;
}

export function getAllArticles(): ArticleMeta[] {
  return readAll()
    .map((a) => a.meta)
    .sort((a, b) =>
      a.domain === b.domain ? a.order - b.order : a.domain.localeCompare(b.domain)
    );
}

export function getArticle(slug: string): Article | null {
  return readAll().find((a) => a.meta.slug === slug) ?? null;
}
