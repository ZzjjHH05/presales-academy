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
  // dev 模式禁用 webpack 持久化缓存：本机多次因 .next/cache 损坏导致 dev server 崩溃
  // （ENOENT 1.pack.gz → unhandledRejection）。牺牲少量冷启动速度，换稳定性。
  webpack: (config, { dev }) => {
    if (dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
