/**
 * Phase 8 · 演示兜底缓存 —— 预置一条典型 JD 的解析结果进 ai_cache。
 *
 * 目的：现场演示时即使断网 / 模型抽风，贴这条 JD 也能秒出完整能力差距卡。
 *
 * 逻辑：
 *  - 本机有 Key 且调用成功（degraded=false）：网关已写 ai_cache，打印确认即可；
 *  - 无 Key / 调用降级（degraded=true）：手动兜底写入 ——
 *    buildJdPrompt 取 system/user → contentHash(AI_MODEL + system + user) 算 hash
 *    → INSERT OR REPLACE INTO ai_cache 写入 fallback 的 result JSON（经 lib/db 的 run）。
 *  - 幂等：重复跑不报错（INSERT OR REPLACE 覆盖）。
 *
 * ⚠️ .env.local 必须在 import lib/ai 之前加载（ai.ts 在模块加载时读取 AI_API_KEY），
 * 所以这里全部用动态 import。
 *
 * 用法：pnpm seed:demo
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** 手动解析 .env.local（无第三方依赖）：让 AI_API_KEY / AI_MODEL 生效。 */
function loadEnvLocal(): void {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    process.env[m[1]] ??= m[2].trim();
  }
}

/** 典型演示 JD（云计算方向，与 eval/jd-cases.json 的 case-02 逐字一致）。 */
const DEMO_JD = `某云计算厂商招聘云售前工程师，负责企业客户上云项目售前技术支撑。岗位职责：1、面向金融、政企等行业客户开展上云咨询与云架构方案设计，输出上云迁移、云容灾等解决方案；2、组织云产品演示与 POC 测试，向客户讲解技术方案与产品价值；3、支持招投标工作，编写投标技术文件并参与讲标；4、跟进客户上云落地效果，收集反馈反哺产品迭代。任职要求：1、计算机相关专业本科及以上学历；2、熟悉 IaaS、PaaS、SaaS 及主流云产品，了解虚拟化、容器与 Kubernetes 技术；3、具备云架构设计与方案编写能力；4、沟通表达清晰，能适应短期出差。`;

async function main(): Promise<void> {
  loadEnvLocal();

  const [{ analyzeJd, buildJdPrompt }, { contentHash }, { jdFallback }, { run }] =
    await Promise.all([
      import("../lib/jd-core"),
      import("../lib/ai"),
      import("../lib/ai-fallback"),
      import("../lib/db"),
    ]);

  const { degraded } = await analyzeJd(DEMO_JD);
  const { system, user } = buildJdPrompt(DEMO_JD);
  const hash = contentHash(system, user);

  if (!degraded) {
    // 网关已写 ai_cache（真实 AI 结果），只需确认
    console.log(`演示缓存就绪（网关已写 ai_cache）：hash 前 10 位 ${hash.slice(0, 10)}`);
    return;
  }

  // 无 Key / 降级：手动兜底写入 fallback 的 result JSON
  const fallback = jdFallback(DEMO_JD);
  await run(
    "INSERT OR REPLACE INTO ai_cache (hash, result, created_at) VALUES (?,?,?)",
    [hash, JSON.stringify(fallback), Date.now()]
  );
  console.log(`演示缓存就绪（无 Key 手动兜底写入 ai_cache）：hash 前 10 位 ${hash.slice(0, 10)}`);
}

main().catch((err) => {
  console.error("[seed:demo] 失败：", err);
  process.exitCode = 1;
});
