/**
 * Phase 5 · JD 解析 —— 降级规则引擎（关键词→域）。
 *
 * 当 AI 无 Key / 超时 / 校验失败时，网关返回本函数产出的同构 JdResult，
 * 前端差距卡 UI 形态一致——「降级不降体验」（D5）。
 *
 * 设计：
 *  - 关键词→域规则表：扫描 JD 文本，命中即产出一条 requirement
 *  - relatedNotes 从真实笔记里按域取（getAllArticles 分组），保证链接可达
 *  - 不足 3 条 requirement / 2 条 question 时用售前通用能力兜底，确保满足 schema
 *  - 纯库实现，依赖 node:fs（lib/content.ts），仅服务端使用
 */
import { getAllArticles } from "./content";
import type { DomainKey } from "@/data/domains";
import type { QuizCategory } from "@/data/quiz-categories";
import type { JdResult } from "./jd-schema";

interface Rule {
  keywords: string[];
  domain: DomainKey;
  weight: "must" | "nice";
  point: string;
  question: { q: string; type: QuizCategory };
}

/**
 * 关键词→域规则表。命中任一关键词即产出一条能力要求。
 * 覆盖六域，与站内笔记一一对应。
 */
const RULES: Rule[] = [
  {
    keywords: ["云", "容器", "虚拟化", "k8s", "docker", "linux", "网络", "数据库", "安全", "技术"],
    domain: "tech",
    weight: "must",
    point: "熟悉云计算、网络、数据库、安全等售前必备技术广度",
    question: { q: "请讲讲你对云计算/网络/安全某一块的理解，售前需要掌握到什么程度？", type: "tech" },
  },
  {
    keywords: ["标书", "讲标", "投标", "招投标", "答标", "poc", "方案设计", "需求调研", "方案编写", "方案宣讲"],
    domain: "core",
    weight: "must",
    point: "具备需求调研、方案设计、标书与讲标、POC 验证等售前核心技能",
    question: { q: "如果给你一个客户需求，请现场拆解并设计方案（五步法）。", type: "solution" },
  },
  {
    keywords: ["沟通", "演讲", "表达", "商务", "报价", "ppt", "提案", "控场"],
    domain: "soft",
    weight: "must",
    point: "优秀的沟通表达与商务能力，能把技术讲清楚、控场演讲",
    question: { q: "讲一次你把复杂技术给非技术人讲清楚的经历（STAR）。", type: "behavior" },
  },
  {
    keywords: ["行业", "客户", "业务", "决策链", "政企", "数字化", "甲方", "采购"],
    domain: "industry",
    weight: "must",
    point: "理解客户所在行业、业务痛点与决策链，具备甲方视角",
    question: { q: "你了解我们所在的行业吗？客户的核心痛点是什么？", type: "open" },
  },
  {
    keywords: ["白皮书", "案例", "产品", "方案库", "案例拆解", "沉淀"],
    domain: "solutions",
    weight: "nice",
    point: "能沉淀行业解决方案、输出白皮书与案例库",
    question: { q: "讲一个你熟悉的产品方案或行业案例，拆解其价值点。", type: "solution" },
  },
  {
    keywords: ["简历", "秋招", "面试", "校招", "求职", "面经", "应届", "2027"],
    domain: "job",
    weight: "nice",
    point: "清晰了解售前校招时间线与面试套路，求职准备充分",
    question: { q: "你为什么想做售前？和产品/销售/技术支持的区别是什么？", type: "open" },
  },
];

/** 售前通用兜底能力（当 JD 命中规则不足 3 条时补齐）。 */
const DEFAULT_RULES: Rule[] = [
  RULES[0], // tech
  RULES[1], // core
  RULES[2], // soft
];

/** 从岗位描述首行/标题词推断岗位名称。 */
function guessPosition(jd: string): string {
  const firstLine = jd.split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? "";
  // 命中"售前/解决方案/售前工程师/售前顾问"等典型岗位词
  const m = firstLine.match(/(售前[工程师顾问]*|解决方案工程师|售前支持|售前技术)/);
  if (m) return m[0];
  if (/售前/.test(jd)) return "售前工程师";
  return "售前工程师";
}

/** 命中检测：JD 文本中是否包含任一关键词（小写比较）。 */
function matches(jdLower: string, rule: Rule): boolean {
  return rule.keywords.some((k) => jdLower.includes(k.toLowerCase()));
}

/**
 * 降级规则引擎：输入 JD 文本，输出同构 JdResult。
 * relatedNotes 取该域下真实存在的笔记 slug（按 order 排序取前几个）。
 */
export function jdFallback(jd: string): JdResult {
  const jdLower = jd.toLowerCase();
  const articles = getAllArticles();

  // 按域分组真实 slug（保证 relatedNotes 链接可达）
  const slugsByDomain = new Map<DomainKey, string[]>();
  for (const a of articles) {
    const arr = slugsByDomain.get(a.domain) ?? [];
    arr.push(a.slug);
    slugsByDomain.set(a.domain, arr);
  }

  const fired = RULES.filter((r) => matches(jdLower, r));
  // 不足 3 条用通用兜底补齐（去重）
  const rules = fired.length >= 3 ? fired : [...fired, ...DEFAULT_RULES.filter((r) => !fired.includes(r))];
  const used = rules.slice(0, 6);

  const requirements = used.map((r) => ({
    point: r.point,
    domain: r.domain,
    weight: r.weight,
    relatedNotes: (slugsByDomain.get(r.domain) ?? []).slice(0, 2),
  }));

  const predictedQuestions = used.map((r) => ({
    q: r.question.q,
    type: r.question.type,
    relatedNotes: (slugsByDomain.get(r.domain) ?? []).slice(0, 2),
  }));

  return {
    position: guessPosition(jd),
    requirements,
    // used 至少 3 条，故 predictedQuestions 至少 3 条，满足 schema 的 min(2)；上限 5
    predictedQuestions: predictedQuestions.slice(0, 5),
  };
}
