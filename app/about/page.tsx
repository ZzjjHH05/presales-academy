import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "关于项目" };

const TECH: [string, string][] = [
  ["Next.js 15（App Router）", "RSC / SSG / 动态路由，内容页面静态生成"],
  ["Markdown 内容管线", "gray-matter + remark/rehype，写文件即发文，Git 管理"],
  ["Tailwind CSS + typography", "原子化样式与文章排版"],
  ["TypeScript", "全站类型安全"],
  ["本地进度打卡", "localStorage 记录，登录后自动同步到云端"],
  ["登录与云端同步", "自研认证（scrypt 哈希 + httpOnly 会话）+ node:sqlite，三块数据自动同步"],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">为什么做这个站</h1>
        <p className="mt-3 leading-relaxed text-slate-600">
          售前 / 解决方案工程师是"用技术解决问题、把方案讲清楚"的岗位。但市面上的学习路线、题库几乎全是开发岗的——
          售前岗的能力体系没人做成产品。所以我边求职边搭了这个站：它既是我的学习路线与笔记库，也是一个全栈作品——
          内容用 Git 管理、路线图数据驱动、游客也能本地打卡。
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">技术栈与设计</h2>
        <ul className="mt-3 space-y-2">
          {TECH.map(([t, d]) => (
            <li key={t} className="flex gap-3 text-sm text-slate-600">
              <span className="mt-0.5 text-brand-600">▸</span>
              <span>
                <span className="font-medium text-slate-800">{t}</span>：{d}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">内容策略</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          结构完整优先于数量：先立六大域骨架，每篇笔记带来源与核实状态，边学边补。
          已上线：秋招投递看板、售前面经题库自测、登录注册与云端进度同步。后续迭代：部署上线、AI 辅助整理 JD。
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/roadmap" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            去学习路线 →
          </Link>
          <Link href="/learn" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            去学习内容 →
          </Link>
        </div>
      </section>
    </div>
  );
}
