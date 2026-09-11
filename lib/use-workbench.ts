"use client";

import { useEffect, useState } from "react";
import type { ReviewOutput, SectionKey } from "./solution-schema";

/**
 * Phase 7 · 方案工作台 —— 本机草稿（**不入云同步**）。
 *
 * 与 use-recruit.ts 的关键差异：
 *  - 不调 schedulePush（草稿只存本机，方案明确不入云同步）
 *  - 不监听 pa-sync（只有本页写它，无需跨页刷新）
 *  - 挂载时读一次即可
 *
 * localStorage 键：pa-workbench-v1，单草稿对象。
 */
export interface WorkbenchSection {
  key: SectionKey;
  heading: string;
  prompts: string[];
  content: string; // 学生自己写的正文
  review?: ReviewOutput;
}

export interface WorkbenchDraft {
  scenarioLabel: string; // 场景名（内置场景名或"自定义"）
  scenarioText: string; // 场景描述（含自定义输入）
  clarifyNotes: string; // 学生对澄清问题的笔记（纯本地，不发给 AI）
  sections: WorkbenchSection[];
  updatedAt: number;
}

const KEY = "pa-workbench-v1";

function emptyDraft(): WorkbenchDraft {
  return {
    scenarioLabel: "",
    scenarioText: "",
    clarifyNotes: "",
    sections: [],
    updatedAt: Date.now(),
  };
}

export function useWorkbench() {
  const [draft, setDraft] = useState<WorkbenchDraft>(emptyDraft);
  const [loaded, setLoaded] = useState(false);

  // 挂载时读一次（不入云同步，无需 pa-sync 监听）
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WorkbenchDraft>;
        if (parsed && typeof parsed === "object") {
          setDraft({
            scenarioLabel:
              typeof parsed.scenarioLabel === "string"
                ? parsed.scenarioLabel
                : "",
            scenarioText:
              typeof parsed.scenarioText === "string"
                ? parsed.scenarioText
                : "",
            clarifyNotes:
              typeof parsed.clarifyNotes === "string"
                ? parsed.clarifyNotes
                : "",
            sections: Array.isArray(parsed.sections) ? parsed.sections : [],
            updatedAt:
              typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
          });
        }
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  /** 合并 patch 后整体覆盖写 localStorage 并更新 updatedAt。 */
  const save = (patch: Partial<WorkbenchDraft>) => {
    setDraft((prev) => {
      const next: WorkbenchDraft = {
        ...prev,
        ...patch,
        updatedAt: Date.now(),
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  /** 清空草稿。 */
  const reset = () => {
    const next = emptyDraft();
    setDraft(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return { draft, save, reset, loaded };
}
