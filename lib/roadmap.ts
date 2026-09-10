import fs from "node:fs";
import path from "node:path";
import type { DomainKey } from "@/data/domains";

export interface RoadmapNode {
  id: string;
  domain: DomainKey;
  title: string;
  blurb: string;
  article?: string;
}

const ROADMAP_PATH = path.join(process.cwd(), "content", "roadmap", "presales.json");

export function getRoadmap(): RoadmapNode[] {
  if (!fs.existsSync(ROADMAP_PATH)) return [];
  const raw = fs.readFileSync(ROADMAP_PATH, "utf8");
  return JSON.parse(raw) as RoadmapNode[];
}
