"use client";

import { useMemo, useState } from "react";
import {
  DIRECTION_LABELS,
  type Company,
  type CompanySource,
  type Direction,
} from "@/data/companies";

type DirectionFilter = "all" | Direction;
type StatusFilter = "all" | "open" | "unknown";

const DIRECTIONS = Object.keys(DIRECTION_LABELS) as Direction[];

/** 方向标签配色（参照 data/domains.ts 的 tailwind 色系风格） */
const DIRECTION_STYLES: Record<Direction, string> = {
  cloud: "bg-sky-50 text-sky-700",
  security: "bg-emerald-50 text-emerald-700",
  network: "bg-indigo-50 text-indigo-700",
  software: "bg-violet-50 text-violet-700",
  hardware: "bg-amber-50 text-amber-700",
  data: "bg-rose-50 text-rose-700",
};

const SOURCE_KIND_LABELS: Record<CompanySource["kind"], string> = {
  official: "官方",
  interview: "面经",
  repost: "转载",
};

const SOURCE_KIND_STYLES: Record<CompanySource["kind"], string> = {
  official: "bg-emerald-50 text-emerald-700",
  interview: "bg-amber-50 text-amber-700",
  repost: "bg-slate-100 text-slate-500",
};

/** 距核实日期的天数（按自然日计算，避免时区误差） */
function daysSince(yyyymmdd: string): number {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  const then = Date.UTC(y, m - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - then) / 86400000);
}

function FreshnessBadge({ verifiedAt }: { verifiedAt: string }) {
  const days = daysSince(verifiedAt);
  if (days <= 7) {
    return (
      <span
        title={`核实于 ${verifiedAt}`}
        className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
      >
        近期核实
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span
        title={`核实于 ${verifiedAt}`}
        className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
      >
        30 天内核实
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      核实于 {verifiedAt}
    </span>
  );
}

function StatusBadge({ status }: { status: Company["status"] }) {
  if (status === "open") {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        2027 届在招
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
      状态未核实
    </span>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const timeline2027 = (company.hiringHistory ?? []).filter((h) => h.year === 2027);

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{company.name}</h3>
        <div className="flex flex-shrink-0 flex-wrap justify-end gap-1">
          <FreshnessBadge verifiedAt={company.verifiedAt} />
          <StatusBadge status={company.status} />
        </div>
      </div>

      <p className="mt-1 text-sm text-slate-500">{company.business}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {company.directions.map((d) => (
          <span
            key={d}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIRECTION_STYLES[d]}`}
          >
            {DIRECTION_LABELS[d]}
          </span>
        ))}
      </div>

      <p className="mt-2 text-xs text-slate-500">城市：{company.cities.join(" · ")}</p>

      {timeline2027.length > 0 && (
        <details className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
          <summary className="cursor-pointer select-none font-medium text-slate-600">
            2027 届时间线
          </summary>
          <div className="mt-2 space-y-2">
            {timeline2027.map((h) => (
              <div key={h.year}>
                {h.batches && h.batches.length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-4 text-slate-600">
                    {h.batches.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {h.note && <p className="mt-1 text-slate-500">{h.note}</p>}
                {h.source && (
                  <a
                    href={h.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block break-all text-brand-600 hover:underline"
                  >
                    时间线来源
                  </a>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="mt-2 px-1 text-xs">
        <summary className="cursor-pointer select-none text-slate-500">
          来源（{company.sources.length}）
        </summary>
        <ul className="mt-2 space-y-1.5">
          {company.sources.map((s) => (
            <li key={s.url} className="flex items-start gap-1.5">
              <span
                className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${SOURCE_KIND_STYLES[s.kind]}`}
              >
                {SOURCE_KIND_LABELS[s.kind]}
              </span>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-brand-600 hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </details>

      <div className="mt-auto pt-3">
        <a
          href={company.careerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-brand-700"
        >
          去官方投递 →
        </a>
        {!company.careerUrlVerified && (
          <p className="mt-1.5 text-xs text-amber-700">
            链接由公告来源提供，如打不开请在官网搜索该公司校招
          </p>
        )}
      </div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs transition ${
        active
          ? "bg-brand-600 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function CompaniesExplorer({ companies }: { companies: Company[] }) {
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(
    () =>
      companies.filter((c) => {
        if (direction !== "all" && !c.directions.includes(direction)) return false;
        if (status !== "all" && c.status !== status) return false;
        return true;
      }),
    [companies, direction, status]
  );

  return (
    <div>
      <div className="mb-5 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-slate-400">方向</span>
          <Pill active={direction === "all"} onClick={() => setDirection("all")}>
            全部
          </Pill>
          {DIRECTIONS.map((d) => (
            <Pill key={d} active={direction === d} onClick={() => setDirection(d)}>
              {DIRECTION_LABELS[d]}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-slate-400">状态</span>
          <Pill active={status === "all"} onClick={() => setStatus("all")}>
            全部
          </Pill>
          <Pill active={status === "open"} onClick={() => setStatus("open")}>
            在招
          </Pill>
          <Pill active={status === "unknown"} onClick={() => setStatus("unknown")}>
            未核实
          </Pill>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          没有匹配的公司，换个筛选条件试试。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CompanyCard key={c.key} company={c} />
          ))}
        </div>
      )}
    </div>
  );
}
