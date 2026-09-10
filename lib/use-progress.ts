"use client";

import { useEffect, useState } from "react";
import { schedulePush } from "@/lib/cloud";

const KEY = "pa-progress-v1";

export interface Progress {
  done: Record<string, boolean>;
}

function loadProgress(): Progress {
  if (typeof window === "undefined") return { done: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      // 归一化：即使数据缺失/损坏也保证有 done 字段
      return { done: p.done && typeof p.done === "object" ? p.done : {} };
    }
  } catch {
    /* ignore */
  }
  return { done: {} };
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>({ done: {} });

  useEffect(() => {
    const reload = () => setProgress(loadProgress());
    reload();
    window.addEventListener("pa-sync", reload);
    return () => window.removeEventListener("pa-sync", reload);
  }, []);

  const toggle = (id: string) => {
    setProgress((prev) => {
      const done = { ...prev.done, [id]: !prev.done[id] };
      const next: Progress = { done };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    schedulePush();
  };

  return { progress, toggle };
}
