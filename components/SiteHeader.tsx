import Link from "next/link";
import AccountBar from "./AccountBar";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/learn", label: "学习内容" },
  { href: "/roadmap", label: "学习路线" },
  { href: "/recruit", label: "投递看板" },
  { href: "/companies", label: "公司库" },
  { href: "/jd", label: "JD 解析" },
  { href: "/quiz", label: "题库自测" },
  { href: "/sources", label: "资料库" },
  { href: "/about", label: "关于项目" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm text-white">
            售
          </span>
          <span>
            售前学院
            <span className="ml-1 hidden text-xs font-normal text-slate-400 sm:inline">
              Presales Academy
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {n.label}
            </Link>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
          <AccountBar />
        </nav>
      </div>
    </header>
  );
}
