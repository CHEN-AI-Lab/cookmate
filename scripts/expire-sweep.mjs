/**
 * 过期订阅降级 cron 脚本
 * ───────────────────────────────────────────────────────────────────────────
 * 背景：CookMate 原本在 /api/dashboard GET 端点里检测到用户 PRO 过期时直接 update
 * 降级为 FREE —— 违反 REST 语义（GET 写库），与未来缓存不兼容。
 *
 * 本脚本独立处理降级，由 Vercel Cron（建议每日 03:00 UTC）或运维手动触发：
 *   - 扫描所有 subscriptionTier='PRO' 且 subscriptionExpiryDate < now() 的用户
 *   - 一次性 updateMany 降级为 FREE
 *   - 输出处理数量
 *
 * 运行（无需安装任何依赖，node 直接跑）：
 *   cd cookmate
 *   node scripts/expire-sweep.mjs
 *   # 或： pnpm expire:sweep
 *
 * 依赖：运行时能从环境变量拿到 DATABASE_URL（与 Next 运行时一致；Prisma Client 会自动读取 .env）。
 *
 * Vercel Cron 配置（apps/web/vercel.json）：
 *   { "crons": [{ "path": "/api/cron/expire-sweep", "schedule": "0 3 * * *" }] }
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const result = await prisma.user.updateMany({
    where: {
      subscriptionTier: "PRO",
      subscriptionExpiryDate: { lt: now },
    },
    data: {
      subscriptionTier: "FREE",
      subscriptionExpiryDate: null,
    },
  })
  console.log(`[expire-sweep] ${result.count} 个 PRO 用户已降级为 FREE（截至 ${now.toISOString()}）`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error("[expire-sweep] 失败：", err)
    return prisma.$disconnect().then(() => process.exit(1))
  })