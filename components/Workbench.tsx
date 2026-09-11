"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { NoteMeta } from "@/components/JdAnalyzer";
import { useWorkbench, type WorkbenchDraft } from "@/lib/use-workbench";
import type {
  ClarifyOutput,
  OutlineOutput,
  ReviewOutput,
} from "@/lib/solution-schema";

/** 三个内置场景（约 100-200 字，口径见 Phase7 任务 5.1）。 */
const BUILTIN_SCENARIOS: { label: string; text: string }[] = [
  {
    label: "连锁零售数字化",
    text: "某连锁便利店品牌（约 300 家门店）要上线小程序商城 + 会员体系，并与门店库存实时打通。客户 IT 团队仅 5 人，预算有限，决策链含运营 VP 与 IT 总监，希望三个月内见到试点效果。",
  },
  {
    label: "制造企业上云",
    text: "某中型制造企业（年营收约 5 亿）计划把本地机房的 ERP/MES 迁移上云。CFO 要求三年总拥有成本不高于自建，生产车间不能停线，数据出境合规无要求，IT 负责人倾向混合云架构。",
  },
  {
    label: "政务信息安全整改",
    text: "某地市政务大数据中心收到等保 2.0 三级整改通知，需在 3 个月内完成安全设备部署与管理制度配套。采购必须走政府采购流程，见效窗口只有一次汇报机会，错过则下年度预算无望。",
  },
];

interface ClarifyResponse extends ClarifyOutput {
  degraded: boolean;
  cached: boolean;
  remaining: number;
}
interface OutlineResponse extends OutlineOutput {
  degraded: boolean;
  cached: boolean;
  remaining: number;
}
interface ReviewResponse extends ReviewOutput {
  degraded: boolean;
  cached: boolean;
  remaining: number;
}

type Phase = "scenario" | "write" | "export";

interface Status {
  degraded: boolean;
  cached: boolean;
  remaining: number;
}

export default function Workbench({
  notes,
}: {
  notes: Record<string, NoteMeta>;
}) {
  const { draft, save, reset, loaded } = useWorkbench();
  const [phase, setPhase] = useState<Phase>("scenario");

  // scenario 阶段
  const [pickedLabel, setPickedLabel] = useState<string>("");
  const [scenarioText, setScenarioText] = useState<string>("");
  const [questions, setQuestions] = useState<ClarifyOutput["questions"]>([]);
  const [clarifyNotes, setClarifyNotes] = useState<string>("");

  // write 阶段
  const [sections, setSections] = useState<OutlineOutput["sections"]>([]);
  const [contents, setContents] = useState<string[]>(["", "", "", "", ""]);
  const [reviews, setReviews] = useState<(ReviewOutput | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);

  const [clarifying, setClarifying] = useState(false);
  const [outlining, setOutlining] = useState(false);
  const [reviewingIdx, setReviewingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  // 草稿恢复：挂载读取后按已有内容定位阶段
  useEffect(() => {
    if (!loaded) return;
    if (draft.sections.length === 5) {
      // 有完整骨架 → 进 write，恢复 sections / contents / reviews
      setSections(draft.sections.map((s) => ({ key: s.key, heading: s.heading, prompts: s.prompts })));
      setContents(draft.sections.map((s) => s.content ?? ""));
      setReviews(draft.sections.map((s) => s.review));
      setPickedLabel(draft.scenarioLabel);
      setScenarioText(draft.scenarioText);
      setClarifyNotes(draft.clarifyNotes);
      setPhase("write");
    } else if (draft.scenarioText) {
      setPickedLabel(draft.scenarioLabel);
      setScenarioText(draft.scenarioText);
      setClarifyNotes(draft.clarifyNotes);
      setPhase("scenario");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // 800ms 防抖自动保存。用 ref 镜像最新 state，避免 setTimeout 闭包读到陈旧值。
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ pickedLabel, scenarioText, clarifyNotes, sections, contents, reviews });
  latestRef.current = { pickedLabel, scenarioText, clarifyNotes, sections, contents, reviews };
  function scheduleSave(patch: Partial<WorkbenchDraft> = {}) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const s = latestRef.current;
      const baseSections =
        s.sections.length === 5
          ? s.sections.map((sec, i) => ({
              key: sec.key,
              heading: sec.heading,
              prompts: sec.prompts,
              content: i < s.contents.length ? s.contents[i] : "",
              review: s.reviews[i],
            }))
          : [];
      save({
        scenarioLabel: s.pickedLabel || "自定义",
        scenarioText: s.scenarioText,
        clarifyNotes: s.clarifyNotes,
        sections: baseSections,
        ...patch,
      });
    }, 800);
  }

  async function fetchClarify() {
    if (scenarioText.trim().length < 20) {
      setError("场景描述至少 20 字");
      return;
    }
    setClarifying(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "clarify", scenario: scenarioText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "今日工作台次数已达上限，登录后可享更多额度"
            : data?.error ?? "获取澄清问题失败，请重试"
        );
        return;
      }
      const r = data as ClarifyResponse;
      setQuestions(r.questions);
      setStatus({ degraded: r.degraded, cached: r.cached, remaining: r.remaining });
    } catch {
      setError("网络异常，请重试");
    } finally {
      setClarifying(false);
    }
  }

  async function fetchOutline() {
    setOutlining(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "outline", scenario: scenarioText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "今日工作台次数已达上限，登录后可享更多额度"
            : data?.error ?? "生成骨架失败，请重试"
        );
        return;
      }
      const r = data as OutlineResponse;
      setSections(r.sections);
      // 按 sections 顺序对齐 contents（已有内容尽量保留，长度不足补空）
      setContents((prev) => r.sections.map((_, i) => prev[i] ?? ""));
      setReviews([undefined, undefined, undefined, undefined, undefined]);
      setStatus({ degraded: r.degraded, cached: r.cached, remaining: r.remaining });
      setPhase("write");
    } catch {
      setError("网络异常，请重试");
    } finally {
      setOutlining(false);
    }
  }

  async function fetchReview(idx: number) {
    const sec = sections[idx];
    const content = contents[idx];
    if (!sec) return;
    if (!content.trim()) {
      setError("请先写一些正文再请求点评");
      return;
    }
    setReviewingIdx(idx);
    setError(null);
    try {
      const res = await fetch("/api/ai/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "review",
          sectionKey: sec.key,
          scenario: scenarioText,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          res.status === 429
            ? "今日工作台次数已达上限，登录后可享更多额度"
            : data?.error ?? "点评失败，请重试"
        );
        return;
      }
      const r = data as ReviewResponse;
      const next = [...reviews];
      next[idx] = {
        verdict: r.verdict,
        comment: r.comment,
        suggestion: r.suggestion,
        relatedNotes: r.relatedNotes,
      };
      setReviews(next);
      setStatus({ degraded: r.degraded, cached: r.cached, remaining: r.remaining });
      // 同步 ref 后保存，避免 setState 异步导致点评漏写
      latestRef.current = { ...latestRef.current, reviews: next };
      scheduleSave();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setReviewingIdx(null);
    }
  }

  function editContent(idx: number, val: string) {
    const next = [...contents];
    next[idx] = val;
    setContents(next);
    scheduleSave({});
  }

  function editClarifyNotes(val: string) {
    setClarifyNotes(val);
    scheduleSave({});
  }

  function buildMarkdown(): string {
    const lines: string[] = [];
    lines.push(`# 售前方案 · ${pickedLabel || "自定义场景"}`);
    lines.push("");
    lines.push("> 这份方案是你自己写的——AI 只给了骨架和点评。");
    lines.push("");
    lines.push("## 场景");
    lines.push(scenarioText);
    lines.push("");
    if (clarifyNotes.trim()) {
      lines.push("## 澄清笔记");
      lines.push(clarifyNotes);
      lines.push("");
    }
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      lines.push(`## ${s.key}：${s.heading}`);
      if (contents[i].trim()) {
        lines.push(contents[i]);
      } else {
        lines.push("（未填写）");
      }
      lines.push("");
    }
    return lines.join("\n");
  }

  async function copyMarkdown() {
    const md = buildMarkdown();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
        return;
      }
    } catch {
      /* ignore */
    }
    // 降级 execCommand
    try {
      const ta = document.createElement("textarea");
      ta.value = md;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      setError("复制失败，请手动选中复制");
    }
  }

  function downloadMarkdown() {
    const md = buildMarkdown();
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `售前方案-${pickedLabel || "自定义"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function startOver() {
    reset();
    setPickedLabel("");
    setScenarioText("");
    setQuestions([]);
    setClarifyNotes("");
    setSections([]);
    setContents(["", "", "", "", ""]);
    setReviews([undefined, undefined, undefined, undefined, undefined]);
    setStatus(null);
    setError(null);
    setPhase("scenario");
  }

  const writtenCount = contents.filter((c) => c.trim().length > 0).length;

  return (
    <div className="space-y-6">
      {/* 顶部常驻提示 */}
      <p className="text-xs text-slate-400">
        草稿仅保存在本机浏览器，不会上传云端。
      </p>

      {/* 状态横幅（复用 P6 风格） */}
      {status && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {status.degraded && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
              降级模式（静态模板 / 自查清单）
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

      {/* 步骤指示 */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {(["scenario", "write", "export"] as Phase[]).map((p, i) => {
          const labels = ["1 场景", "2 写方案", "3 导出"];
          const active = phase === p;
          const done =
            (p === "scenario" && (phase === "write" || phase === "export")) ||
            (p === "write" && phase === "export");
          return (
            <span
              key={p}
              className={`rounded-full px-2.5 py-1 ${
                active
                  ? "bg-brand-600 text-white"
                  : done
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {labels[i]}
            </span>
          );
        })}
      </div>

      {phase === "scenario" && (
        <ScenarioView
          pickedLabel={pickedLabel}
          scenarioText={scenarioText}
          onPickBuiltin={(label, text) => {
            setPickedLabel(label);
            setScenarioText(text);
            setError(null);
            scheduleSave();
          }}
          onEditText={(v) => {
            setScenarioText(v);
            setPickedLabel("自定义");
            scheduleSave();
          }}
          questions={questions}
          clarifying={clarifying}
          clarifyNotes={clarifyNotes}
          onClarifyNotes={editClarifyNotes}
          onFetchClarify={fetchClarify}
          onFetchOutline={fetchOutline}
          outlining={outlining}
        />
      )}

      {phase === "write" && (
        <WriteView
          sections={sections}
          contents={contents}
          reviews={reviews}
          notes={notes}
          reviewingIdx={reviewingIdx}
          onEditContent={editContent}
          onFetchReview={fetchReview}
          onGoExport={() => setPhase("export")}
          writtenCount={writtenCount}
        />
      )}

      {phase === "export" && (
        <ExportView
          markdown={buildMarkdown()}
          onCopy={copyMarkdown}
          onDownload={downloadMarkdown}
          onReset={startOver}
        />
      )}
    </div>
  );
}

/* ---------------- scenario ---------------- */

function ScenarioView({
  pickedLabel,
  scenarioText,
  onPickBuiltin,
  onEditText,
  questions,
  clarifying,
  clarifyNotes,
  onClarifyNotes,
  onFetchClarify,
  onFetchOutline,
  outlining,
}: {
  pickedLabel: string;
  scenarioText: string;
  onPickBuiltin: (label: string, text: string) => void;
  onEditText: (v: string) => void;
  questions: ClarifyOutput["questions"];
  clarifying: boolean;
  clarifyNotes: string;
  onClarifyNotes: (v: string) => void;
  onFetchClarify: () => void;
  onFetchOutline: () => void;
  outlining: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          选一个场景开始练习（点卡片即选中，可再编辑）
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {BUILTIN_SCENARIOS.map((s) => {
            const picked = pickedLabel === s.label;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => onPickBuiltin(s.label, s.text)}
                className={`rounded-lg border p-3 text-left transition ${
                  picked
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-brand-300"
                }`}
              >
                <span className="text-sm font-medium text-slate-800">
                  {s.label}
                </span>
                <span className="mt-1 line-clamp-3 text-xs text-slate-500">
                  {s.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          场景描述（编辑后将记为「自定义」）
        </label>
        <textarea
          value={scenarioText}
          onChange={(e) => onEditText(e.target.value)}
          rows={5}
          placeholder="描述一个售前场景：客户是谁、想做什么、有什么约束……（至少 20 字）"
          className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:border-brand-400 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-400">
          {scenarioText.length} 字 · 当前标签：{pickedLabel || "未选"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onFetchClarify}
          disabled={clarifying || scenarioText.trim().length < 20}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clarifying ? "正在出问题…" : "获取澄清问题"}
        </button>
        <button
          type="button"
          onClick={onFetchOutline}
          disabled={outlining || scenarioText.trim().length < 20}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {outlining ? "正在搭骨架…" : "直接搭骨架"}
        </button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            AI 教练的澄清问题（你不必全答，先想清楚）
          </h3>
          <ul className="space-y-2">
            {questions.map((q, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <p className="text-sm font-medium text-slate-800">
                  {i + 1}. {q.q}
                </p>
                <p className="mt-1 text-xs text-slate-500">为什么问：{q.why}</p>
              </li>
            ))}
          </ul>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              我的澄清笔记（纯本地，不发给 AI）
            </label>
            <textarea
              value={clarifyNotes}
              onChange={(e) => onClarifyNotes(e.target.value)}
              rows={4}
              placeholder="把你对上面问题的思考、客户背景、关键约束记在这里……"
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:border-brand-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onFetchOutline}
            disabled={outlining}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {outlining ? "正在搭骨架…" : "下一步：搭骨架 →"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- write ---------------- */

function WriteView({
  sections,
  contents,
  reviews,
  notes,
  reviewingIdx,
  onEditContent,
  onFetchReview,
  onGoExport,
  writtenCount,
}: {
  sections: OutlineOutput["sections"];
  contents: string[];
  reviews: (ReviewOutput | undefined)[];
  notes: Record<string, NoteMeta>;
  reviewingIdx: number | null;
  onEditContent: (idx: number, val: string) => void;
  onFetchReview: (idx: number) => void;
  onGoExport: () => void;
  writtenCount: number;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        每段下面的灰色问句是 AI 给的引导，<span className="font-medium">正文必须你自己写</span>——
        写完一段可点「请求点评」让教练对照该段要素点评。
      </div>

      {sections.map((s, i) => (
        <SectionEditor
          key={s.key}
          section={s}
          content={contents[i] ?? ""}
          review={reviews[i]}
          notes={notes}
          reviewing={reviewingIdx === i}
          onEdit={(v) => onEditContent(i, v)}
          onReview={() => onFetchReview(i)}
        />
      ))}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onGoExport}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          下一步：导出 →
        </button>
        <span className="text-xs text-slate-400">
          已写 {writtenCount}/5 段（可跳过未写段直接导出）
        </span>
      </div>
    </div>
  );
}

function SectionEditor({
  section,
  content,
  review,
  notes,
  reviewing,
  onEdit,
  onReview,
}: {
  section: OutlineOutput["sections"][number];
  content: string;
  review: ReviewOutput | undefined;
  notes: Record<string, NoteMeta>;
  reviewing: boolean;
  onEdit: (v: string) => void;
  onReview: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          {section.key}：{section.heading}
        </h3>
        {review && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              review.verdict === "good"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {review.verdict === "good" ? "过关" : "建议改进"}
          </span>
        )}
      </div>

      <ul className="mt-2 space-y-1">
        {section.prompts.map((p, j) => (
          <li key={j} className="text-xs text-slate-400">
            · {p}
          </li>
        ))}
      </ul>

      <textarea
        value={content}
        onChange={(e) => onEdit(e.target.value)}
        rows={5}
        placeholder="在这里写这一段的正文……"
        className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-800 focus:border-brand-400 focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReview}
          disabled={reviewing || content.trim().length === 0}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reviewing ? "点评中…" : "请求点评"}
        </button>
        <span className="text-xs text-slate-400">{content.length} 字</span>
      </div>

      {review && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-slate-700">{review.comment}</p>
          <p className="text-slate-600">
            <span className="font-medium text-slate-700">建议：</span>
            {review.suggestion}
          </p>
          {review.relatedNotes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {review.relatedNotes.map((slug) => {
                const meta = notes[slug];
                return (
                  <Link
                    key={slug}
                    href={`/learn/${slug}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <span>→</span>
                    {meta?.title ?? slug}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- export ---------------- */

function ExportView({
  markdown,
  onCopy,
  onDownload,
  onReset,
}: {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
        这份方案是你自己写的——AI 只给了骨架和点评。
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          复制 Markdown
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          下载 .md
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          开新练习
        </button>
      </div>
      <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
{markdown}
      </pre>
    </div>
  );
}
