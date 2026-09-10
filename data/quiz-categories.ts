export type QuizCategory = "behavior" | "solution" | "tech" | "open";

export const QUIZ_CATEGORIES: {
  key: QuizCategory;
  label: string;
  desc: string;
  emoji: string;
  color: string;
  bg: string;
}[] = [
  {
    key: "behavior",
    label: "行为面",
    desc: "经历、动机、软实力",
    emoji: "🧭",
    color: "text-sky-700",
    bg: "bg-sky-50",
  },
  {
    key: "solution",
    label: "方案面",
    desc: "现场拆需求、做设计",
    emoji: "🧩",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  {
    key: "tech",
    label: "技术广度面",
    desc: "云 / 网络 / 数据常识",
    emoji: "🛰️",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
  },
  {
    key: "open",
    label: "开放题",
    desc: "认知、职业规划、差异化",
    emoji: "💡",
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
];
