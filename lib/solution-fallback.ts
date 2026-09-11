/**
 * Phase 7 · 五步法工作台 —— 降级引擎（纯服务端，禁止 import 进客户端组件）。
 *
 * 当 AI 无 Key / 超时 / 校验失败时，网关返回本函数产出的同构结果，
 * 前端 UI 形态一致——「降级不降体验」（同 P5/P6 范式）。
 *
 * 方法论文本取自真实存在的站内笔记 content/learn/core/solution-five-steps.md
 * （SPIN 简化提问：现状/问题/暗示/价值；方案书最小骨架；常见坑），
 * 不凭空编造、不创建新笔记。
 *
 * 红线：所有产出都是问句 / 标题 / 引导短语 / 自查清单——绝不输出成段正文。
 *
 * 纯库实现，仅服务端使用（导入会拉入 node:fs 间接依赖）。
 */
import type {
  ClarifyOutput,
  OutlineOutput,
  ReviewOutput,
  SectionKey,
} from "./solution-schema";

/**
 * 降级澄清模板：7 条 SPIN 简化问句 + 决策链 / 约束 / 隐性需求，
 * 风格按 solution-five-steps 笔记的 SPIN 简化版与常见坑。
 * scenario 入参保留以对齐契约，静态模板不解析自由文本（降级即保底）。
 */
export function clarifyFallback(scenario: string): ClarifyOutput {
  void scenario;
  return {
    questions: [
      {
        q: "你们现在这套业务流程和系统是怎么跑的？",
        why: "先把现状摸清，否则后面所有方案都是空中楼阁（现状问不清必返工）。",
      },
      {
        q: "现状里哪里最耗时、最贵、或最危险？",
        why: "聚焦核心痛点而非功能罗列，避免把「客户想要的」当「需求」。",
      },
      {
        q: "这个痛点再拖一年会怎样？",
        why: "放大痛点的暗示，帮客户自己算清不解决的代价，驱动决策。",
      },
      {
        q: "解决后第一个月，你希望看到什么可量化的变化？",
        why: "把「要快/要安全」这种模糊诉求问成具体指标，方案价值才有锚点。",
      },
      {
        q: "这个项目谁来拍板、谁买单、谁实际来用？",
        why: "决策链不清是售前最大坑——漏掉决策者，方案可能根本进不了预算。",
      },
      {
        q: "预算、时间线、合规红线分别是什么？",
        why: "约束决定方案可行性边界，避免做完才发现预算或合规过不去。",
      },
      {
        q: "除了直接对接人，最终用户和运营方各自在意什么？",
        why: "只听对接人会漏掉隐性需求，落地后常被最终用户和运营卡住。",
      },
    ],
  };
}

/** 降级骨架：固定五段（现状→痛点→方案→价值→风险），每段标题 + 引导问句，零正文。 */
export function outlineFallback(scenario: string): OutlineOutput {
  void scenario;
  return {
    sections: [
      {
        key: "现状",
        heading: "现状：客户业务流程与系统",
        prompts: [
          "客户当前的业务流程和系统是什么？",
          "哪些环节靠人工、最耗时？",
          "现状里最不稳定的是什么？",
        ],
      },
      {
        key: "痛点",
        heading: "痛点：聚焦核心问题",
        prompts: [
          "客户最想解决的一个核心痛点是什么？",
          "这个痛点影响的是效率、成本还是风险？",
          "为什么现在才必须解决（触发因素）？",
        ],
      },
      {
        key: "方案",
        heading: "方案：结构化设计",
        prompts: [
          "方案整体分为哪几个层次（不止产品堆砌）？",
          "每一层解决前面的哪个痛点？",
          "落地分几个阶段、各阶段交付什么？",
        ],
      },
      {
        key: "价值",
        heading: "价值：量化且对齐痛点",
        prompts: [
          "方案带来的收益如何量化（数字/对比）？",
          "每项价值对应解决了哪条痛点？",
          "多长时间能看到回报？",
        ],
      },
      {
        key: "风险",
        heading: "风险：主动提及与应对",
        prompts: [
          "落地最大风险是什么（技术/组织/合规）？",
          "每条风险对应什么应对措施？",
          "兜底方案是什么？",
        ],
      },
    ],
  };
}

/** 每段的自查清单（降级点评用），对照 solution-five-steps 笔记的要素。 */
const SECTION_CHECKLIST: Record<SectionKey, string> = {
  现状:
    "先讲业务流程再讲系统；量化人工环节耗时；点名最不稳定的环节；说清客户决策链与约束。",
  痛点:
    "聚焦一个核心痛点而非罗列功能；点明痛点影响的是效率/成本/风险；说清为什么现在必须解决。",
  方案:
    "结构化分层设计而非产品堆砌；每层对应解决的痛点；给出分阶段交付计划。",
  价值:
    "收益尽量量化（数字/对比）；每项价值对齐一条痛点；说明回报周期。",
  风险:
    "主动提及而非回避；每条风险配应对措施；给出兜底方案。",
};

/** 降级点评：verdict=improve，给该段通用自查清单，relatedNotes 固定 solution-five-steps。 */
export function reviewFallback(sectionKey: SectionKey): ReviewOutput {
  return {
    verdict: "improve",
    comment: "当前为降级模式，以下是该段的通用自查要点",
    suggestion: SECTION_CHECKLIST[sectionKey],
    relatedNotes: ["solution-five-steps"],
  };
}
