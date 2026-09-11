"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COMPANIES } from "@/data/companies";
import { QUIZ_CATEGORIES, type QuizCategory } from "@/data/quiz-categories";
import { DOMAIN_MAP, type DomainKey } from "@/data/domains";
import type { InterviewQuestion, ReviewOutput } from "@/lib/interview-schema";
import { useInterview, type InterviewRecord } from "@/lib/use-interview";

/** 页面注入的笔记元信息：slug → { title, domain }，复用 P5 JdAnalyzer 的类型形态。 */
export interface NoteMeta {
  title: string;
  domain: DomainKey;
}

interface GenerateResponse {
  questions: InterviewQuestion[];
  degraded: boolean;
  cached: boolean;
  remaining: number;
}
interface ReviewResponse extends ReviewOutput {
  degraded: boolean;
  cached: boolean;
  remaining: number;
}

const TYPE_META: Record<QuizCategory, { label: string; emoji: string; color: string; bg: string }> =
  Object.fromEntries(
    QUIZ_CATEGORIES.map((c) => [c.key, { label: c.label, emoji: c.emoji, color: c.color, bg: c.bg }])
  ) as Record<QuizCategory, { label: string; emoji: string; color: string; bg: string }>;

const PROGRESS_KEY = "pa-progress-v1";

/** 只读 pa-progress-v1 的 done 集合，监听 pa-sync 跨页刷新（复用 P5 范式）。 */
function useDoneSet(): Set<string> {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    const reload = () => {
      try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        if (raw) {
          const p = JSON.parse(raw) as { done?: Record<string, boolean> };
          if (p.done && typeof p.done === "object") {
            setDone(new Set(Object.keys(p.done).filter((k) => p.done![k])));
          }
        }
      } catch {
        /* ignore */
      }
    };
    reload();
    window.addEventListener("pa-sync", reload);
    return () => window.removeEventListener("pa-sync", reload);
  }, []);
  return done;
}

type Phase = "setup" | "session" | "done";

export default function InterviewSimulator({
  notes,
}: {
  notes: Record<string, NoteMeta>;
}) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [companyKey, setCompanyKey] = useState("");
  const [categories, setCategories] = useState<QuizCategory[]>(["behavior", "solution"]);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [reviews, setReviews] = useState<(ReviewOutput | undefined)[]>([undefined, undefined, undefined]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ degraded: boolean; cached: boolean; remaining: number } | null>(null);
  const [saved, setSaved] = useState(false);

  const done = useDoneSet();
  const { records, add, remove } = useInterview();

  function companyName(key: string): string {
    if (!key) return "通用面试";
    return COMPANIES.find((c) => c.key === key)?.name ?? "通用面试";
  }

  function toggleCategory(c: QuizCategory) {
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function startSession() {
    if (categories.length === 0) {
      setError("至少选择 1 个题型");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", companyKey, categories }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "今日模拟面试次数已达上限，登录后可享更多额度"
            : data?.error ?? "出题失败，请重试"
        );
        return;
      }
      const r = data as GenerateResponse;
      setQuestions(r.questions);
      setAnswers(["", "", ""]);
      setReviews([undefined, undefined, undefined]);
      setCurrentIdx(0);
      setStatus({ degraded: r.degraded, cached: r.cached, remaining: r.remaining });
      setSaved(false);
      setPhase("session");
    } catch {
      setError("网络异常，请检查后重试");
    } finally {
      setGenerating(false);
    }
  }

  async function submitAnswer(idx: number) {
    const ans = answers[idx].trim();
    if (!ans) {
      setError("请先写下你的作答");
      return;
    }
    setReviewing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "review",
          companyKey,
          question: questions[idx].question,
          answer: ans,
          type: questions[idx].type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "今日模拟面试次数已达上限，登录后可享更多额度"
            : data?.error ?? "点评失败，请重试"
        );
        return;
      }
      const r = data as ReviewResponse;
      const nextReviews = [...reviews];
      nextReviews[idx] = r;
      setReviews(nextReviews);
      setStatus({ degraded: r.degraded, cached: r.cached, remaining: r.remaining });
      // 3 题答完自动进 done
      if (idx >= 2) {
        setPhase("done");
      }
    } catch {
      setError("网络异常，请检查后重试");
    } finally {
      setReviewing(false);
    }
  }

  function saveRecord() {
    add({
      companyKey,
      companyName: companyName(companyKey),
      categories,
      items: questions.map((q, i) => ({
        question: q.question,
        type: q.type,
        answer: answers[i],
        review: reviews[i],
      })),
      finished: true,
    });
    setSaved(true);
  }

  function resetToSetup() {
    setPhase("setup");
    setQuestions([]);
    setAnswers(["", "", ""]);
    setReviews([undefined, undefined, undefined]);
    setCurrentIdx(0);
    setError(null);
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      {/* 状态横幅（复用 P5 风格） */}
      {status && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {status.degraded && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
              降级模式（题库 / rubric 模板）
            </span>
          )}
          {status.cached && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500">
              命中缓存
            </span>
          )}
          {typeof status.remaining === "number" && (
            <span className="text-slate-400">今日剩余 {status.remaining} 次</span>
          )}
        </div>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      {phase === "setup" && (
        <SetupView
          companyKey={companyKey}
          setCompanyKey={setCompanyKey}
          categories={categories}
          toggleCategory={toggleCategory}
          generating={generating}
          onStart={startSession}
        />
      )}

      {phase === "session" && (
        <SessionView
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          reviews={reviews}
          currentIdx={currentIdx}
          setCurrentIdx={setCurrentIdx}
          reviewing={reviewing}
          onSubmit={submitAnswer}
          notes={notes}
          done={done}
        />
      )}

      {phase === "done" && (
        <DoneView
          questions={questions}
          answers={answers}
          reviews={reviews}
          companyName={companyName(companyKey)}
          saved={saved}
          onSave={saveRecord}
          onReset={resetToSetup}
          notes={notes}
          done={done}
        />
      )}

      {/* 历史记录 */}
      <HistoryView records={records} notes={notes} done={done} onRemove={remove} />
    </div>
  );
}

/* ---------------- setup ---------------- */

function SetupView({
  companyKey,
  setCompanyKey,
  categories,
  toggleCategory,
  generating,
  onStart,
}: {
  companyKey: string;
  setCompanyKey: (v: string) => void;
  categories: QuizCategory[];
  toggleCategory: (c: QuizCategory) => void;
  generating: boolean;
  onStart: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">选择公司</label>
        <select
          value={companyKey}
          onChange={(e) => setCompanyKey(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        >
          <option value="">通用面试（不指定公司）</option>
          {COMPANIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-400">
          选定公司后，AI 会参照该公司面经风格出题（部分公司未填面经风格，则按主营业务调性）。
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">题型（至少 1 个）</label>
        <div className="flex flex-wrap gap-2">
          {QUIZ_CATEGORIES.map((c) => {
            const active = categories.includes(c.key);
            return (
              <button
                key={c.key}
                onClick={() => toggleCategory(c.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onStart}
          disabled={generating || categories.length === 0}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "AI 出题中…" : "开始模拟面试 →"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- session ---------------- */

function SessionView({
  questions,
  answers,
  setAnswers,
  reviews,
  currentIdx,
  setCurrentIdx,
  reviewing,
  onSubmit,
  notes,
  done,
}: {
  questions: InterviewQuestion[];
  answers: string[];
  setAnswers: (a: string[]) => void;
  reviews: (ReviewOutput | undefined)[];
  currentIdx: number;
  setCurrentIdx: (i: number) => void;
  reviewing: boolean;
  onSubmit: (idx: number) => void;
  notes: Record<string, NoteMeta>;
  done: Set<string>;
}) {
  const q = questions[currentIdx];
  const review = reviews[currentIdx];
  const meta = TYPE_META[q.type];

  return (
    <div className="space-y-4">
      {/* 进度 */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          第 {currentIdx + 1} / {questions.length} 题
        </span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full ${
                i === currentIdx ? "bg-brand-500" : i < currentIdx ? "bg-brand-300" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* 题目卡 */}
      <div className={`rounded-2xl border border-slate-200 ${meta.bg} p-4`}>
        <div className="flex items-start gap-2">
          <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium ${meta.color} bg-white/70`}>
            {meta.emoji} {meta.label}
          </span>
          <p className="text-sm font-medium text-slate-800">{q.question}</p>
        </div>
        {q.relatedNotes.length > 0 && (
          <NoteLinks slugs={q.relatedNotes} notes={notes} done={done} />
        )}
      </div>

      {/* 作答区 */}
      <textarea
        value={answers[currentIdx]}
        onChange={(e) => {
          const next = [...answers];
          next[currentIdx] = e.target.value;
          setAnswers(next);
        }}
        placeholder="写下你的作答，尽量按对应方法论结构（行为面用 STAR、方案面用五步法…）"
        rows={6}
        className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {answers[currentIdx].trim().length} 字
        </span>
        <button
          onClick={() => onSubmit(currentIdx)}
          disabled={reviewing || !answers[currentIdx].trim()}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reviewing ? "AI 点评中…" : review ? "重新点评" : "提交并获取点评"}
        </button>
      </div>

      {/* 点评卡 */}
      {review && (
        <ReviewCard review={review} notes={notes} done={done} />
      )}

      {/* 下一题 */}
      {review && currentIdx < questions.length - 1 && (
        <div className="flex justify-end">
          <button
            onClick={() => setCurrentIdx(currentIdx + 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300"
          >
            下一题 →
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- 点评卡 ---------------- */

function ReviewCard({
  review,
  notes,
  done,
}: {
  review: ReviewOutput;
  notes: Record<string, NoteMeta>;
  done: Set<string>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <p className="text-sm text-slate-700">
        <span className="font-medium text-slate-900">结构点评：</span>
        {review.structure}
      </p>

      {review.strengths.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-emerald-700">做得好的</p>
          <ul className="space-y-1">
            {review.strengths.map((s, i) => (
              <li key={i} className="flex gap-1.5 text-sm text-slate-700">
                <span className="text-emerald-500">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.improvements.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-amber-700">改进建议</p>
          <ul className="space-y-1">
            {review.improvements.map((s, i) => (
              <li key={i} className="flex gap-1.5 text-sm text-slate-700">
                <span className="text-amber-500">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.referencePoints.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-500">参考要点</p>
          <ul className="space-y-1">
            {review.referencePoints.map((s, i) => (
              <li key={i} className="flex gap-1.5 text-sm text-slate-600">
                <span className="text-slate-400">·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.relatedNotes.length > 0 && (
        <NoteLinks slugs={review.relatedNotes} notes={notes} done={done} />
      )}
    </div>
  );
}

/* ---------------- done ---------------- */

function DoneView({
  questions,
  answers,
  reviews,
  companyName,
  saved,
  onSave,
  onReset,
  notes,
  done,
}: {
  questions: InterviewQuestion[];
  answers: string[];
  reviews: (ReviewOutput | undefined)[];
  companyName: string;
  saved: boolean;
  onSave: () => void;
  onReset: () => void;
  notes: Record<string, NoteMeta>;
  done: Set<string>;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
        <h2 className="text-base font-semibold text-brand-800">本次模拟面试完成</h2>
        <p className="mt-1 text-sm text-brand-700">
          {companyName} · 共 {questions.length} 题，逐题作答与点评如下。
        </p>
      </div>

      {questions.map((q, i) => {
        const meta = TYPE_META[q.type];
        return (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium ${meta.color} ${meta.bg}`}>
                {meta.emoji} {meta.label}
              </span>
              <p className="text-sm font-medium text-slate-800">{q.question}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">你的作答</p>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{answers[i]}</p>
            </div>
            {reviews[i] && <ReviewCard review={reviews[i]!} notes={notes} done={done} />}
          </div>
        );
      })}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          onClick={onSave}
          disabled={saved}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saved ? "已保存 ✓" : "保存本次记录"}
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300"
        >
          再来一轮
        </button>
      </div>
      {saved && (
        <p className="text-right text-xs text-slate-400">已保存到本机，登录后自动云同步，换设备可见。</p>
      )}
    </div>
  );
}

/* ---------------- 历史记录 ---------------- */

function HistoryView({
  records,
  notes,
  done,
  onRemove,
}: {
  records: InterviewRecord[];
  notes: Record<string, NoteMeta>;
  done: Set<string>;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
        暂无历史记录。完成一次模拟面试后，点「保存本次记录」即可在此查看。
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-slate-900">历史记录</h2>
      {records.map((r) => {
        const open = expanded === r.id;
        const reviewed = r.items.filter((it) => it.review).length;
        return (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setExpanded(open ? null : r.id)}
                className="flex flex-1 flex-wrap items-center gap-2 text-left"
              >
                <span className="text-sm font-medium text-slate-800">{r.companyName}</span>
                <span className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleString("zh-CN")}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">
                  {r.categories.map((c) => TYPE_META[c].label).join("/")}
                </span>
                <span className="text-[11px] text-slate-400">
                  点评 {reviewed}/{r.items.length} · {r.finished ? "已完成" : "未完成"}
                </span>
              </button>
              <button
                onClick={() => onRemove(r.id)}
                className="flex-shrink-0 rounded px-2 py-0.5 text-xs text-slate-400 transition hover:text-rose-600"
              >
                删除
              </button>
            </div>
            {open && (
              <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                {r.items.map((it, i) => {
                  const meta = TYPE_META[it.type];
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${meta.color} ${meta.bg}`}>
                          {meta.label}
                        </span>
                        <p className="text-sm text-slate-700">{it.question}</p>
                      </div>
                      <p className="whitespace-pre-wrap pl-1 text-xs text-slate-500">{it.answer}</p>
                      {it.review && (
                        <ReviewCard review={it.review} notes={notes} done={done} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- 笔记直链（复用 P5 NoteLinks 样式） ---------------- */

function NoteLinks({
  slugs,
  notes,
  done,
}: {
  slugs: string[];
  notes: Record<string, NoteMeta>;
  done: Set<string>;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {slugs.map((slug) => {
        const meta = notes[slug];
        const isDone = done.has(slug);
        return (
          <Link
            key={slug}
            href={`/learn/${slug}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition hover:border-brand-300 hover:text-brand-700 ${
              isDone
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>{isDone ? "✓" : "→"}</span>
            {meta?.title ?? slug}
          </Link>
        );
      })}
    </div>
  );
}
