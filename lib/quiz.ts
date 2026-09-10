import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { QuizCategory } from "@/data/quiz-categories";

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  question: string;
  hint: string;
  minutes: number;
  answer: string;
}

const QUIZ_DIR = path.join(process.cwd(), "content", "quiz");

export function getQuiz(): QuizQuestion[] {
  if (!fs.existsSync(QUIZ_DIR)) return [];
  const out: QuizQuestion[] = [];
  for (const file of fs.readdirSync(QUIZ_DIR)) {
    if (!file.endsWith(".md")) continue;
    const id = path.basename(file, ".md");
    const raw = fs.readFileSync(path.join(QUIZ_DIR, file), "utf8");
    const { data, content } = matter(raw);
    out.push({
      id,
      category: (data.category as QuizCategory) ?? "open",
      question: typeof data.question === "string" ? data.question : id,
      hint: typeof data.hint === "string" ? data.hint : "",
      minutes: typeof data.minutes === "number" ? data.minutes : 5,
      answer: content.trim(),
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
