import type { Metadata } from "next";
import { getQuiz } from "@/lib/quiz";
import { renderMarkdown } from "@/lib/markdown";
import QuizApp from "@/components/QuizApp";

export const metadata: Metadata = { title: "题库自测" };

export default async function QuizPage() {
  const questions = getQuiz();
  const views = await Promise.all(
    questions.map(async (x) => ({
      id: x.id,
      category: x.category,
      question: x.question,
      hint: x.hint,
      minutes: x.minutes,
      answerHtml: await renderMarkdown(x.answer),
    }))
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">售前面经题库 · 自测</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        行为面 / 方案面 / 技术广度 / 开放题四类：先自己答，再看参考答案；用「掌握 / 收藏 /
        错题」标记，安排复习优先级。
      </p>
      <QuizApp questions={views} />
    </div>
  );
}
