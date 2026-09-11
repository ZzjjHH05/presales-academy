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
  // 安全响应头：全站自包含（无外部 CDN/字体/图片），CSP 可收紧到 'self'。
  // script-src 保留 'unsafe-inline' 'unsafe-eval'：Next 水合与 dev 热更新需要；
  // 上 nonce 方案是后续可选项，当前性价比不高。
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
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
