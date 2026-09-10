"use client";

import { useEffect, useState } from "react";
import { schedulePush } from "@/lib/cloud";

export type RecruitStatus =
  | "pending"
  | "applied"
  | "test"
  | "interview"
  | "offer"
  | "closed";

export interface RecruitItem {
  id: string;
  company: string;
  position: string;
  city: string;
  status: RecruitStatus;
  deadline: string;
  link: string;
  notes: string;
  createdAt: string;
}

export const RECRUIT_STATUSES: {
  key: RecruitStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "pending", label: "待投递", color: "text-slate-600", bg: "bg-slate-100" },
  { key: "applied", label: "已投递", color: "text-sky-700", bg: "bg-sky-100" },
  { key: "test", label: "笔试中", color: "text-indigo-700", bg: "bg-indigo-100" },
  { key: "interview", label: "面试中", color: "text-amber-700", bg: "bg-amber-100" },
  { key: "offer", label: "已拿 Offer", color: "text-emerald-700", bg: "bg-emerald-100" },
  { key: "closed", label: "已结束", color: "text-slate-400", bg: "bg-slate-200" },
];

const KEY = "pa-recruit-v1";

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

export function useRecruit() {
  const [items, setItems] = useState<RecruitItem[]>([]);

  useEffect(() => {
    const reload = () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const arr = JSON.parse(raw);
          // 归一化：保证是数组，避免损坏数据导致崩溃
          if (Array.isArray(arr)) setItems(arr as RecruitItem[]);
        }
      } catch {
        /* ignore */
      }
    };
    reload();
    window.addEventListener("pa-sync", reload);
    return () => window.removeEventListener("pa-sync", reload);
  }, []);

  const save = (next: RecruitItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    schedulePush();
  };

  const add = (item: Omit<RecruitItem, "id" | "createdAt">) => {
    const next: RecruitItem = {
      ...item,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    save([next, ...items]);
  };

  const update = (id: string, patch: Partial<RecruitItem>) => {
    save(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const remove = (id: string) => save(items.filter((i) => i.id !== id));

  return { items, add, update, remove };
}
