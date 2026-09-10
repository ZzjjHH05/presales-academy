export type DomainKey =
  | "industry"
  | "tech"
  | "core"
  | "solutions"
  | "soft"
  | "job";

export interface Domain {
  key: DomainKey;
  title: string;
  short: string;
  description: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
}

export const DOMAINS: Domain[] = [
  {
    key: "industry",
    title: "行业与业务理解",
    short: "甲方视角 · 业务场景",
    description: "理解客户在做什么生意、痛点在哪、决策链是谁——这是售前一切方案的起点。",
    emoji: "🏢",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  {
    key: "tech",
    title: "技术广度基础",
    short: "网络 · 云 · 数据 · 安全",
    description: "售前不用写代码，但要能把网络、云、数据库、安全等技术聊得专业、问得清楚。",
    emoji: "🛰️",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  {
    key: "core",
    title: "售前核心技能",
    short: "需求 · 方案 · 讲标",
    description: "从需求挖掘到方案设计、标书与讲标、POC——售前最值钱的手艺。",
    emoji: "🛠️",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    key: "solutions",
    title: "产品与方案沉淀",
    short: "案例库 · 白皮书",
    description: "把公司产品和行业案例沉淀成自己的方案库，面试与实战都靠它。",
    emoji: "📦",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    key: "soft",
    title: "软技能与商业",
    short: "沟通 · 演讲 · 报价",
    description: "把技术讲成人话、控场演讲、懂商务报价——售前进阶的分水岭。",
    emoji: "💬",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  {
    key: "job",
    title: "求职专项",
    short: "简历 · 秋招 · 面经",
    description: "售前岗的简历怎么写、秋招时间线怎么排、面经怎么答，都在这里。",
    emoji: "🎯",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
];

export const DOMAIN_MAP: Record<DomainKey, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.key, d])
) as Record<DomainKey, Domain>;
