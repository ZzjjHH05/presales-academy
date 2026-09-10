import type { Metadata } from "next";
import { getRoadmap } from "@/lib/roadmap";
import RoadmapView from "@/components/RoadmapView";

export const metadata: Metadata = { title: "学习路线" };

export default function RoadmapPage() {
  const nodes = getRoadmap();
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">售前能力树 · 学习路线</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        六大知识域，节点即主题：点右侧圆圈标记完成，有文章的直接跳转去学习。进度保存在本机浏览器。
      </p>
      <RoadmapView nodes={nodes} />
    </div>
  );
}
