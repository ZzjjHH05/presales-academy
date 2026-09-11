import type { Metadata } from "next";
import { COMPANIES } from "@/data/companies";
import CompaniesExplorer from "@/components/CompaniesExplorer";

export const metadata: Metadata = { title: "售前校招公司库" };

export default function CompaniesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">售前校招公司库</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        信息核实于 2026-09-10；招聘信息变动快，投递前请以各公司官网为准。
      </p>
      <CompaniesExplorer companies={COMPANIES} />
    </div>
  );
}
