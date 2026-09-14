/**
 * Phase 8 · JD eval 评测脚本 —— 10 条标注样本跑 JD 解析通过率（双模式）。
 *
 * 用法：pnpm eval
 *  - 第一遍（真实模式，默认）：读取 .env.local 的 AI_API_KEY，逐条 analyzeJd 打分
 *  - 第二遍（降级模式，--degraded）：由本脚本以子进程方式重跑
 *    （环境变量剥离 AI_API_KEY），验证无 Key 时降级路径的 schema / slug 红线
 *
 * 为什么降级用子进程：lib/ai.ts 在模块加载时捕获 AI_API_KEY，
 * 同进程 delete process.env.AI_API_KEY 不会让网关进入降级分支（仍会用旧 Key 走真调用）。
 *
 * 召回率匹配规则：expectedPoint 小写化去空白后，是任一 requirement.point
 * 小写化去空白后的子串，即算命中；recall = 命中数 / 该 case expectedPoints 总数。
 *
 * 数据流：analyzeJd 直连纯解析核心，不调 consumeRateLimit（不烧额度、不扣限流）。
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const CASES_FILE = path.join(ROOT, "eval", "jd-cases.json");
const DEGRADED = process.argv.includes("--degraded");

interface EvalCase {
  id: string;
  industry: string;
  jdText: string;
  expectedPoints: string[];
}

interface CaseResult {
  id: string;
  industry: string;
  recall: number;
  hits: number;
  total: number;
  degraded: boolean;
  cached: boolean;
  schemaOk: boolean;
  slugsOk: boolean;
}

/** 小写化 + 去空白，用于子串匹配。 */
const norm = (s: string): string => s.toLowerCase().replace(/\s+/g, "");

/** 手动解析 .env.local（无第三方依赖）：跳过 AI_API_KEY（由调用方按模式注入）。 */
function loadEnvLocal(): void {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || m[1] === "AI_API_KEY") continue;
    process.env[m[1]] ??= m[2].trim();
  }
}

/** 从 .env.local 读 AI_API_KEY（只在真实模式注入，不打印值）。 */
function readApiKeyFromEnvLocal(): string | undefined {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return undefined;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*AI_API_KEY\s*=\s*(.*?)\s*$/);
    if (m && m[1]) return m[1].trim();
  }
  return undefined;
}

/** 逐条跑 analyzeJd，返回每 case 的评分。 */
async function runCases(cases: EvalCase[]): Promise<CaseResult[]> {
  const [{ analyzeJd }, { jdResultSchema }, { getAllArticles }] = await Promise.all([
    import("../lib/jd-core"),
    import("../lib/jd-schema"),
    import("../lib/content"),
  ]);
  const validSlugs = new Set(getAllArticles().map((a) => a.slug));
  const out: CaseResult[] = [];
  for (const c of cases) {
    let degraded = true;
    let cached = false;
    let result: import("../lib/jd-schema").JdResult | null = null;
    try {
      const r = await analyzeJd(c.jdText);
      degraded = r.degraded;
      cached = r.cached;
      result = r.result;
    } catch (err) {
      console.error(`[eval] ${c.id} 执行异常：`, err);
    }
    const schemaOk = result !== null && jdResultSchema.safeParse(result).success;
    const slugsOk =
      result !== null &&
      result.requirements.every((r) => r.relatedNotes.every((s) => validSlugs.has(s))) &&
      result.predictedQuestions.every((q) => q.relatedNotes.every((s) => validSlugs.has(s)));
    const points = result !== null ? result.requirements.map((r) => norm(r.point)) : [];
    let hits = 0;
    for (const ep of c.expectedPoints) {
      const n = norm(ep);
      if (points.some((p) => p.includes(n))) hits++;
    }
    out.push({
      id: c.id,
      industry: c.industry,
      recall: c.expectedPoints.length ? hits / c.expectedPoints.length : 0,
      hits,
      total: c.expectedPoints.length,
      degraded,
      cached,
      schemaOk,
      slugsOk,
    });
  }
  return out;
}

/** 打印逐 case 明细表。 */
function printCaseTable(title: string, results: CaseResult[]): void {
  console.log(`\n=== ${title} ===`);
  for (const r of results) {
    const problems =
      (!r.schemaOk ? 1 : 0) + (!r.slugsOk ? 1 : 0);
    console.log(
      `${r.id} | ${r.industry} | recall ${(r.recall * 100).toFixed(0)}% (${r.hits}/${r.total})` +
        ` | degraded ${r.degraded ? "yes" : "no"} | cached ${r.cached ? "yes" : "no"}` +
        ` | 问题 ${problems}`
    );
  }
}

interface Assertion {
  label: string;
  ok: boolean;
  detail: string;
}

function printAssertions(assertions: Assertion[]): void {
  for (const a of assertions) {
    console.log(`${a.ok ? "[✓]" : "[✗]"} ${a.label}（${a.detail}）`);
  }
}

/** 真实模式（第一遍）：跑 case + 启动降级子进程 + 汇总。 */
async function runRealMode(cases: EvalCase[]): Promise<void> {
  console.log("JD eval · 第一遍：真实模式（真实 AI_API_KEY）");
  const results = await runCases(cases);

  const schemaRate = results.filter((r) => r.schemaOk).length / results.length;
  const slugRate = results.filter((r) => r.slugsOk).length / results.length;
  const nonDegradedRate = results.filter((r) => !r.degraded).length / results.length;
  const avgRecall = results.reduce((s, r) => s + r.recall, 0) / results.length;

  printCaseTable("真实模式 · 逐 case 明细", results);

  const pass1: Assertion[] = [
    { label: "schema 合法率 = 100%", ok: schemaRate === 1, detail: `${(schemaRate * 100).toFixed(0)}% (${results.length}/${results.length})` },
    { label: "slug 白名单率 = 100%", ok: slugRate === 1, detail: `${(slugRate * 100).toFixed(0)}%` },
    { label: "非降级率 ≥ 90%", ok: nonDegradedRate >= 0.9, detail: `${(nonDegradedRate * 100).toFixed(0)}%` },
    { label: "总召回率 ≥ 80%", ok: avgRecall >= 0.8, detail: `${(avgRecall * 100).toFixed(1)}%` },
  ];
  printAssertions(pass1);

  // 第二遍：降级模式子进程（剥离 AI_API_KEY）
  const env = { ...process.env };
  delete env.AI_API_KEY;
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", path.join(ROOT, "scripts", "eval-jd.ts"), "--degraded"],
    { env, encoding: "utf8" }
  );
  if (child.stdout) process.stdout.write(child.stdout);
  if (child.stderr) process.stderr.write(child.stderr);

  // 解析子进程的摘要行
  let degradedResults: CaseResult[] = [];
  const summaryLine = (child.stdout ?? "").split("\n").find((l) => l.startsWith("__EVAL_SUMMARY__"));
  if (summaryLine) {
    try {
      degradedResults = JSON.parse(summaryLine.slice("__EVAL_SUMMARY__".length)).degraded;
    } catch {
      console.error("[eval] 无法解析降级子进程摘要");
    }
  }
  const pass2AllGood =
    degradedResults.length === cases.length &&
    degradedResults.every((r) => r.schemaOk && r.slugsOk) &&
    degradedResults.every((r) => r.degraded);
  const pass2: Assertion[] = [
    { label: "降级模式全 case 通过（schema + slug 红线）", ok: pass2AllGood, detail: `${degradedResults.length}/${cases.length}` },
  ];
  printAssertions(pass2);

  const all = [...pass1, ...pass2];
  const passed = all.filter((a) => a.ok).length;
  const overall = passed / all.length;
  console.log(`\n总通过率：${passed}/${all.length} 断言通过（${(overall * 100).toFixed(0)}%）`);
  console.log(exitNote(overall === 1));

  console.log("\n--- 粘贴进 README 的数字块（pnpm eval 实测） ---");
  console.log(readmeBlock(schemaRate, nonDegradedRate, avgRecall, passed === all.length));

  if (overall !== 1) process.exitCode = 1;
}

/** 降级模式（第二遍，子进程）：只跑一遍 + 打印 JSON 摘要供父进程汇总。 */
async function runDegradedMode(cases: EvalCase[]): Promise<void> {
  const results = await runCases(cases);
  printCaseTable("降级模式（无 Key）· 逐 case 明细（降级不考核召回率）", results);

  const schemaRate = results.filter((r) => r.schemaOk).length / results.length;
  const slugRate = results.filter((r) => r.slugsOk).length / results.length;
  const allDegraded = results.every((r) => r.degraded);
  printAssertions([
    { label: "schema 合法率 = 100%", ok: schemaRate === 1, detail: `${(schemaRate * 100).toFixed(0)}%` },
    { label: "slug 白名单率 = 100%", ok: slugRate === 1, detail: `${(slugRate * 100).toFixed(0)}%` },
    { label: "全部走降级分支", ok: allDegraded, detail: `${results.filter((r) => r.degraded).length}/${results.length}` },
  ]);
  console.log("\n__EVAL_SUMMARY__" + JSON.stringify({ degraded: results }));
}

function exitNote(ok: boolean): string {
  return ok ? "（全部通过，退出码 0）" : "（存在失败断言，退出码 1）";
}

function readmeBlock(
  schemaRate: number,
  nonDegradedRate: number,
  avgRecall: number,
  allPass: boolean
): string {
  return `| 指标 | 数值 |
|---|---|
| 评测样本 | 10 条 / 10 个行业 |
| schema 合法率 | ${(schemaRate * 100).toFixed(0)}%（10/10） |
| slug 白名单率 | 100%（真实 + 降级两遍） |
| 非降级率（真实 Key） | ${(nonDegradedRate * 100).toFixed(0)}%（10/10） |
| 总召回率（真实 Key） | ${(avgRecall * 100).toFixed(1)}%（expectedPoints 子串匹配） |
| 降级路径（无 Key） | ${allPass ? "PASS" : "FAIL"} |
| 运行命令 | \`pnpm eval\` |`;
}

async function main(): Promise<void> {
  if (!fs.existsSync(CASES_FILE)) {
    console.error(`[eval] 找不到评测集：${CASES_FILE}`);
    process.exitCode = 1;
    return;
  }
  loadEnvLocal();
  const cases: EvalCase[] = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));
  if (cases.length !== 10) {
    console.error(`[eval] 评测集应为 10 条，实际 ${cases.length} 条`);
    process.exitCode = 1;
    return;
  }

  if (!DEGRADED) {
    // 真实模式：注入 Key
    if (!process.env.AI_API_KEY) {
      const k = readApiKeyFromEnvLocal();
      if (k) process.env.AI_API_KEY = k;
    }
    await runRealMode(cases);
  } else {
    await runDegradedMode(cases);
  }
}

main().catch((err) => {
  console.error("[eval] 未捕获异常：", err);
  process.exitCode = 1;
});
