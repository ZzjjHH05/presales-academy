"use client";

import { useEffect, useState } from "react";
import { schedulePush } from "@/lib/cloud";

const KEY = "pa-quiz-v1";

export interface QuizState {
  mastered: Record<string, boolean>;
  starred: Record<string, boolean>;
  wrong: Record<string, boolean>;
}

type Field = keyof QuizState;

function loadState(): QuizState {
  const base: QuizState = { mastered: {}, starred: {}, wrong: {} };
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<QuizState>;
      // 归一化：即使数据缺失/损坏也保证三个字段都存在
      return {
        mastered: s.mastered && typeof s.mastered === "object" ? s.mastered : {},
        starred: s.starred && typeof s.starred === "object" ? s.starred : {},
        wrong: s.wrong && typeof s.wrong === "object" ? s.wrong : {},
      };
    }
  } catch {
    /* ignore */
  }
  return base;
}

export function useQuizState() {
  const [state, setState] = useState<QuizState>({
    mastered: {},
    starred: {},
    wrong: {},
  });

  useEffect(() => {
    const reload = () => setState(loadState());
    reload();
    window.addEventListener("pa-sync", reload);
    return () => window.removeEventListener("pa-sync", reload);
  }, []);

  const toggle = (field: Field, id: string) => {
    setState((prev) => {
      const next: QuizState = {
        ...prev,
        [field]: { ...prev[field], [id]: !prev[field][id] },
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    schedulePush();
  };

  return { state, toggle };
}
