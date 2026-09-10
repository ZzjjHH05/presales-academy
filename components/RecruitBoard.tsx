"use client";

import { useState } from "react";
import {
  useRecruit,
  RECRUIT_STATUSES,
  type RecruitItem,
  type RecruitStatus,
} from "@/lib/use-recruit";

const emptyForm = { company: "", position: "", city: "", deadline: "", link: "", notes: "" };

function daysLeft(deadline: string): number | null {
  if (!deadline) return null;
  const d = new Date(`${deadline}T00:00:00`);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

export default function RecruitBoard() {
  const { items, add, update, remove } = useRecruit();
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);

  const submit = () => {
    if (!form.company.trim()) return;
    add({
      company: form.company.trim(),
      position: form.position.trim(),
      city: form.city.trim(),
      status: "pending",
      deadline: form.deadline,
      link: form.link.trim(),
      notes: form.notes.trim(),
    });
    setForm(emptyForm);
  };

  const counts = RECRUIT_STATUSES.map((s) => ({
    ...s,
    n: items.filter((i) => i.status === s.key).length,
  }));

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {counts.map((c) => (
          <div key={c.key} className={`rounded-lg ${c.bg} px-3 py-2 text-center`}>
            <div className={`text-lg font-bold ${c.color}`}>{c.n}</div>
            <div className="text-xs text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mb-4 rounded-lg border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
      >
        {open ? "收起添加" : "＋ 添加投递"}
      </button>

      {open && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="公司（必填）"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="岗位"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="城市"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="投递链接"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="备注"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <button
            onClick={submit}
            className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            保存
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {RECRUIT_STATUSES.map((s) => {
          const list = items.filter((i) => i.status === s.key);
          return (
            <section key={s.key} className="rounded-xl border border-slate-200 bg-white/60 p-3">
              <h2 className={`mb-2 text-sm font-semibold ${s.color}`}>
                {s.label}（{list.length}）
              </h2>
              <div className="space-y-2">
                {list.length === 0 && <p className="text-xs text-slate-400">暂无</p>}
                {list.map((it) => (
                  <RecruitCard
                    key={it.id}
                    item={it}
                    onStatus={(st) => update(it.id, { status: st })}
                    onDelete={() => remove(it.id)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function RecruitCard({
  item,
  onStatus,
  onDelete,
}: {
  item: RecruitItem;
  onStatus: (s: RecruitStatus) => void;
  onDelete: () => void;
}) {
  const dl = daysLeft(item.deadline);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{item.company}</p>
          <p className="text-xs text-slate-500">
            {item.position}
            {item.city ? ` · ${item.city}` : ""}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-xs text-slate-300 hover:text-red-500"
          aria-label="删除"
        >
          ✕
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <select
          value={item.status}
          onChange={(e) => onStatus(e.target.value as RecruitStatus)}
          className="rounded border border-slate-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-brand-400"
        >
          {RECRUIT_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        {dl !== null && (
          <span
            className={
              dl < 0 ? "text-red-500" : dl <= 3 ? "text-amber-600" : "text-slate-400"
            }
          >
            {dl < 0 ? "已截止" : `剩 ${dl} 天`}
          </span>
        )}
      </div>
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block truncate text-xs text-brand-600 hover:underline"
        >
          {item.link}
        </a>
      )}
      {item.notes && <p className="mt-1 text-xs text-slate-500">{item.notes}</p>}
    </div>
  );
}
