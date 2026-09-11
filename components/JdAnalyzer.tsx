"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DOMAIN_MAP, type DomainKey } from "@/data/domains";
import { QUIZ_CATEGORIES, type QuizCategory } from "@/data/quiz-categories";
import type { JdResult } from "@/lib/jd-schema";

/** 页面注入的笔记元信息：slug → { title, domain }，用于展示链接标题。 */
export interface NoteMeta {
  title: string;
  domain: DomainKey;
}

interface ApiResponse extends JdResult {
  degraded: boolean;
  cached: boolean;
  remaining: number;
}

const SAMPLE_JD = `【岗位名称】售前解决方案工程师（2027届校招）
【工作地点】北京 / 上海 / 深圳
【岗位职责】
1. 负责政企客户的需求调研与技术交流，完成售前方案设计与宣讲；
2. 参与招投标全流程，包括技术方案编写、讲标与答标；
3. 配合销售完成 POC 验证，推动项目落地；
4. 沉淀行业解决方案，输出白皮书与案例库。
【任职要求】
1. 本科及以上学历，计算机、通信、软件工程相关专业优先；
2. 熟悉云计算、容器、虚拟化、网络安全等基础技术；
3. 优秀的沟通表达能力，能把技术讲清楚、控场演讲；
4. 了解政企数字化转型，理解客户决策链与采购流程；
5. 有方案设计或案例拆解经验者优先。`;

const QUIZ_LABEL: Record<QuizCategory, string> = Object.fromEntries(
  QUIZ_CATEGORIES.map((c) => [c.key, c.label])
) as Record<QuizCategory, string>;

const KEY = "pa-progress-v1";

/** 只读 pa-progress-v1 的 done 集合，监听 pa-sync 跨页刷新。 */
function useDoneSet(): Set<string> {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    const reload = () => {
      try {
        const raw = localStorage.getItem(KEY);
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

export default function JdAnalyzer({
  notes,
}: {
  notes: Record<string, NoteMeta>;
}) {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useDoneSet();

  async function analyze() {
    if (jd.trim().length < 20) {
      setError("JD 内容太短（至少 20 字）");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "今日解析次数已达上限，登录后可享更多额度"
            : data?.error ?? "解析失败，请重试"
        );
        setResult(null);
      } else {
        setResult(data as ApiResponse);
      }
    } catch {
      setError("网络异常，请检查后重试");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 输入区 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="粘贴一段招聘 JD（岗位职责 + 任职要求），AI 会输出结构化能力差距卡，每条要求都直链站内学习笔记。"
          rows={8}
          className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setJd(SAMPLE_JD)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            填入示例 JD
          </button>
          <button
            onClick={analyze}
            disabled={loading || jd.trim().length < 20}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "解析中…" : "解析 JD →"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-rose-600">{error}</p>
        )}
      </div>

      {/* 结果区 */}
      {result && (
        <ResultView result={result} notes={notes} done={done} />
      )}
    </div>
  );
}

function ResultView({
  result,
  notes,
  done,
}: {
  result: ApiResponse;
  notes: Record<string, NoteMeta>;
  done: Set<string>;
}) {
  return (
    <div className="space-y-5">
      {/* 状态条 */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
          岗位：{result.position}
        </span>
        {result.degraded && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
            降级模式（规则引擎）
          </span>
        )}
        {result.cached && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-500">
            命中缓存
          </span>
        )}
        {typeof result.remaining === "number" && (
          <span className="text-slate-400">今日剩余 {result.remaining} 次</span>
        )}
      </div>

      {/* 能力差距卡 */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          能力差距卡
          <span className="ml-2 text-xs font-normal text-slate-400">
            （共 {result.requirements.length} 条，按域着色）
          </span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.requirements.map((r, i) => {
            const d = DOMAIN_MAP[r.domain];
            return (
              <div
                key={i}
                className={`rounded-xl border ${d.border} ${d.bg} p-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm ${d.color}`}>
                    {d.emoji} {d.title}
                  </span>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.weight === "must"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.weight === "must" ? "硬性要求" : "加分项"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-700">{r.point}</p>
                {r.relatedNotes.length > 0 && (
                  <NoteLinks
                    slugs={r.relatedNotes}
                    notes={notes}
                    done={done}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 预测面试题 */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          预测面试题
          <span className="ml-2 text-xs font-normal text-slate-400">
            （共 {result.predictedQuestions.length} 题）
          </span>
        </h2>
        <ul className="space-y-2">
          {result.predictedQuestions.map((q, i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {QUIZ_LABEL[q.type]}
                </span>
                <p className="text-sm text-slate-700">{q.q}</p>
              </div>
              {q.relatedNotes.length > 0 && (
                <NoteLinks
                  slugs={q.relatedNotes}
                  notes={notes}
                  done={done}
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** 笔记直链组：slug → /learn/[slug]，标题来自 notes 注入，已打卡显示 ✓。 */
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
