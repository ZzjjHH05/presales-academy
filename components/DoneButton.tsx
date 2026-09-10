"use client";

import { useProgress } from "@/lib/use-progress";

export default function DoneButton({
  id,
  label = "标记为已学",
}: {
  id: string;
  label?: string;
}) {
  const { progress, toggle } = useProgress();
  const done = !!progress.done[id];
  return (
    <button
      onClick={() => toggle(id)}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
        done
          ? "bg-emerald-600 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
      }`}
    >
      <span>{done ? "✓" : "○"}</span>
      {done ? "已完成" : label}
    </button>
  );
}
