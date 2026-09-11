"use client";

import { useEffect, useState } from "react";
import { schedulePush } from "@/lib/cloud";
import type { QuizCategory } from "@/data/quiz-categories";
import type { ReviewOutput } from "@/lib/interview-schema";

/** 一道题的作答 + 点评。 */
export interface InterviewItem {
  question: string;
  type: QuizCategory;
  answer: string;
  review?: ReviewOutput; // 逐题点评完成才有
}

/** 一次完整模拟面试记录。 */
export interface InterviewRecord {
  id: string; // uid()
  createdAt: string; // ISO
  companyKey: string; // "" = 通用
  companyName: string; // 展示名
  categories: QuizCategory[];
  items: InterviewItem[];
  finished: boolean;
}

const KEY = "pa-interview-v1";

function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 记录 hook（照抄 use-recruit.ts 范式：localStorage 读写、pa-sync 监听、save 后 schedulePush）。 */
export function useInterview() {
  const [records, setRecords] = useState<InterviewRecord[]>([]);

  useEffect(() => {
    const reload = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          // 归一化：保证是数组，避免损坏数据导致崩溃
          if (Array.isArray(arr)) setRecords(arr as InterviewRecord[]);
        }
      } catch {
        /* ignore */
      }
    };
    reload();
    window.addEventListener("pa-sync", reload);
    return () => window.removeEventListener("pa-sync", reload);
  }, []);

  // 本地全量覆盖写；id 并集语义交给云端 merge（pa-interview-v1 走数组按 id 去重分支）
  const save = (next: InterviewRecord[]) => {
    setRecords(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    schedulePush();
  };

  const add = (item: Omit<InterviewRecord, "id" | "createdAt">) => {
    const next: InterviewRecord = {
      ...item,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    save([next, ...records]);
  };

  const update = (id: string, patch: Partial<InterviewRecord>) => {
    save(records.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const remove = (id: string) => save(records.filter((r) => r.id !== id));

  return { records, add, update, remove };
}
