"use client";

import { useMemo, useState } from "react";
import { QUIZ_CATEGORIES, type QuizCategory } from "@/data/quiz-categories";
import { useQuizState, type QuizState } from "@/lib/use-quiz";

export interface QuizQuestionView {
  id: string;
  category: QuizCategory;
  question: string;
  hint: string;
  minutes: number;
  answerHtml: string;
}

type Filter = "all" | QuizCategory;

export default function QuizApp({ questions }: { questions: QuizQuestionView[] }) {
  const { state, toggle } = useQuizState();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return questions.filter((x) => {
      if (filter !== "all" && x.category !== filter) return false;
      if (!kw) return true;
      return `${x.question} ${x.hint}`.toLowerCase().includes(kw);
    });
  }, [questions, q, filter]);

  const mastered = Object.values(state.mastered).filter(Boolean).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          共 {questions.length} 题 · 已掌握 {mastered}
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索题目…"
          className="w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        <button onClick={() => setFilter("all")} className={chip(filter === "all")}>
          全部
        </button>
        {QUIZ_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={chip(filter === c.key)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((x) => (
          <QuizCard key={x.id} q={x} state={state} onToggle={toggle} />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">没有匹配的题目。</p>
        )}
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return `rounded-full px-3 py-1 text-xs transition ${
    active
      ? "bg-brand-600 text-white"
      : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300"
  }`;
}

function QuizCard({
  q,
  state,
  onToggle,
}: {
  q: QuizQuestionView;
  state: QuizState;
  onToggle: (f: keyof QuizState, id: string) => void;
}) {
  const [show, setShow] = useState(false);
  const cat = QUIZ_CATEGORIES.find((c) => c.key === q.category)!;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.color} ${cat.bg}`}>
          {cat.emoji} {cat.label}
        </span>
        <span className="text-xs text-slate-400">{q.minutes} 分钟</span>
      </div>
      <h3 className="mt-2 font-medium text-slate-900">{q.question}</h3>
      {q.hint && <p className="mt-1 text-xs text-slate-400">💡 {q.hint}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShow((v) => !v)}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          {show ? "收起答案" : "查看答案"}
        </button>
        <TagButton
          active={!!state.mastered[q.id]}
          onClick={() => onToggle("mastered", q.id)}
          label="掌握"
          activeClass="bg-emerald-600 text-white"
        />
        <TagButton
          active={!!state.starred[q.id]}
          onClick={() => onToggle("starred", q.id)}
          label="收藏"
          activeClass="bg-amber-500 text-white"
        />
        <TagButton
          active={!!state.wrong[q.id]}
          onClick={() => onToggle("wrong", q.id)}
          label="错题"
          activeClass="bg-red-500 text-white"
        />
      </div>
      {show && (
        <div
          className="prose prose-sm prose-slate mt-3 max-w-none border-t border-slate-100 pt-3"
          dangerouslySetInnerHTML={{ __html: q.answerHtml }}
        />
      )}
    </div>
  );
}

function TagButton({
  active,
  onClick,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? activeClass
          : "border border-slate-300 bg-white text-slate-600 hover:border-slate-400"
      }`}
    >
      {label}
    </button>
  );
}
