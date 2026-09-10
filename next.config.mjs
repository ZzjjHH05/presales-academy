/** @type {import('next').NextConfig} */

// 运行时用 fs 读取的 content/ 目录（learn 笔记、quiz 题库、roadmap JSON）
// 全部纳入 serverless 函数打包，避免 Vercel 上找不到文件。
const CONTENT_GLOBS = [
  "./content/learn/**/*",
  "./content/quiz/**/*",
  "./content/roadmap/**/*",
];

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/": CONTENT_GLOBS,
    "/learn": CONTENT_GLOBS,
    "/learn/[slug]": CONTENT_GLOBS,
    "/roadmap": CONTENT_GLOBS,
    "/quiz": CONTENT_GLOBS,
  },
};

export default nextConfig;
