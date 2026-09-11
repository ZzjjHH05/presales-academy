import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { QuizCategory } from "@/data/quiz-categories";
import { getAllArticles } from "@/lib/content";

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  question: string;
  hint: string;
  minutes: number;
  answer: string;
  /** 相关笔记 slug 列表（已白名单过滤为真实存在的 slug） */
  relatedNotes: string[];
}

const QUIZ_DIR = path.join(process.cwd(), "content", "quiz");

export function getQuiz(): QuizQuestion[] {
  if (!fs.existsSync(QUIZ_DIR)) return [];
  // 用 content/learn 里真实存在的 slug 做白名单
  const validSlugs = new Set(getAllArticles().map((a) => a.slug));
  const out: QuizQuestion[] = [];
  for (const file of fs.readdirSync(QUIZ_DIR)) {
    if (!file.endsWith(".md")) continue;
    const id = path.basename(file, ".md");
    const raw = fs.readFileSync(path.join(QUIZ_DIR, file), "utf8");
    const { data, content } = matter(raw);
    // relatedNotes：必须是字符串数组，且过滤为真实存在的 slug（不存在的直接丢弃，不报错）
    const relatedNotes = Array.isArray(data.relatedNotes)
      ? data.relatedNotes
          .filter((s): s is string => typeof s === "string" && s.length > 0)
          .filter((s) => validSlugs.has(s))
      : [];
    out.push({
      id,
      category: (data.category as QuizCategory) ?? "open",
      question: typeof data.question === "string" ? data.question : id,
      hint: typeof data.hint === "string" ? data.hint : "",
      minutes: typeof data.minutes === "number" ? data.minutes : 5,
      answer: content.trim(),
      relatedNotes,
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
