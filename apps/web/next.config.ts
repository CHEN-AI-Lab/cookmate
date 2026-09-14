import type { NextConfig } from "next"
import { resolve } from "path"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
  devIndicators: false,
  outputFileTracingRoot: resolve("../.."),
  async headers() {
    return [
      {
        // 后台接口一律不缓存。未显式设置时响应头是 `public, max-age=0, must-revalidate`，
        // 对需要登录的接口语义不正确（`public` 允许 CDN/浏览器存副本），故显式关闭，
        // 确保后台列表每次刷新都取实时数据。
        source: "/api/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              // connect-src 需放行 https：页面访问统计上报到外部 stats-worker（与 aaigc 的 proxy.ts 口径一致），
              // 收紧到 'self' 会导致浏览器拦截上报，访问量/来源/国家等前端统计数据断流（2026-09-03 引入）
              "connect-src 'self' https:",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)