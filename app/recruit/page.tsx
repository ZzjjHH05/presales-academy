import type { Metadata } from "next";
import RecruitBoard from "@/components/RecruitBoard";

export const metadata: Metadata = { title: "秋招投递看板" };

export default function RecruitPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">秋招投递看板</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        记录目标公司与投递状态，截止日期自动倒计时。数据保存在本机浏览器，登录后自动同步到云端。
      </p>
      <RecruitBoard />
    </div>
  );
}
