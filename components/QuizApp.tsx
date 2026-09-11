"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { QUIZ_CATEGORIES, type QuizCategory } from "@/data/quiz-categories";
import { useQuizState, type QuizState } from "@/lib/use-quiz";

export interface QuizQuestionView {
  id: string;
  category: QuizCategory;
  question: string;
  hint: string;
  minutes: number;
  answerHtml: string;
  /** 相关笔记 slug 列表（已白名单过滤为真实存在的 slug） */
  relatedNotes: string[];
}

type Filter = "all" | QuizCategory;

interface CatStat {
  key: QuizCategory;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  total: number;
  masteredCount: number;
  wrongCount: number;
  engaged: number;
  correctRate: number | null;
  /** 该类题目 relatedNotes 中出现频次最高的 slug */
  topNote: string | null;
}

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

  // 结果统计：按四类统计正确率，最低的为薄弱项
  const { byCat, weak, hasEngagement } = useMemo(() => {
    const list: CatStat[] = QUIZ_CATEGORIES.map((c) => {
      const inCat = questions.filter((x) => x.category === c.key);
      const masteredCount = inCat.filter((x) => state.mastered[x.id]).length;
      const wrongCount = inCat.filter((x) => state.wrong[x.id]).length;
      const engaged = masteredCount + wrongCount;
      const correctRate = engaged > 0 ? masteredCount / engaged : null;
      const freq = new Map<string, number>();
      for (const x of inCat) {
        for (const s of x.relatedNotes) freq.set(s, (freq.get(s) ?? 0) + 1);
      }
      let topNote: string | null = null;
      let topN = 0;
      for (const [s, n] of freq) {
        if (n > topN) {
          topNote = s;
          topN = n;
        }
      }
      return {
        key: c.key,
        label: c.label,
        emoji: c.emoji,
        color: c.color,
        bg: c.bg,
        total: inCat.length,
        masteredCount,
        wrongCount,
        engaged,
        correctRate,
        topNote,
      };
    });
    const engagedList = list.filter((x) => x.engaged > 0);
    let weak: CatStat | null = null;
    for (const x of engagedList) {
      if (!weak || (x.correctRate ?? 1) < (weak.correctRate ?? 1)) weak = x;
    }
    return { byCat: list, weak, hasEngagement: engagedList.length > 0 };
  }, [questions, state]);

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

      {hasEngagement && (
        <ResultPanel byCat={byCat} weak={weak} />
      )}

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

function ResultPanel({ byCat, weak }: { byCat: CatStat[]; weak: CatStat | null }) {
  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">📊 四类正确率</span>
        <span className="text-xs text-slate-400">
          正确率 = 掌握 ÷（掌握 + 错题），按你标记的「掌握 / 错题」计算
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {byCat.map((s) => {
          const isWeak = weak !== null && s.key === weak.key;
          return (
            <div
              key={s.key}
              className={`rounded-lg border p-2.5 ${
                isWeak ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${s.color}`}>
                  {s.emoji} {s.label}
                </span>
                {isWeak && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    薄弱项
                  </span>
                )}
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-800">
                {s.correctRate === null ? (
                  <span className="text-sm text-slate-400">未练习</span>
                ) : (
                  `${Math.round(s.correctRate * 100)}%`
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                掌握 {s.masteredCount} / 错题 {s.wrongCount}（共 {s.total}）
              </div>
            </div>
          );
        })}
      </div>
      {weak && weak.topNote && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-slate-500">
            📖 {weak.label}薄弱，建议先复习：
          </span>
          <Link
            href={`/learn/${weak.topNote}`}
            className="font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            去复习 →
          </Link>
        </div>
      )}
    </div>
  );
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
  const isWrong = !!state.wrong[q.id];

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
          active={isWrong}
          onClick={() => onToggle("wrong", q.id)}
          label="错题"
          activeClass="bg-red-500 text-white"
        />
      </div>

      {/* 答错（标记为错题）后：显示复习对应笔记 */}
      {isWrong && q.relatedNotes.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
          <span className="text-xs text-slate-500">📖 复习对应笔记：</span>
          {q.relatedNotes.map((slug) => (
            <Link
              key={slug}
              href={`/learn/${slug}`}
              className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              {slug} →
            </Link>
          ))}
        </div>
      )}

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
