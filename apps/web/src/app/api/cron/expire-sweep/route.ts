/**
 * Cron 路由：过期订阅自动降级
 * ───────────────────────────────────────────────────────────────────────────
 * 触发方式：Vercel Cron 定时调用（Vercel 自动注入 Authorization: Bearer ${CRON_SECRET}），或手动 curl -H "Authorization: Bearer ***"
 *
 * 功能：
 *   - 扫描所有 subscriptionTier='PRO' 且 subscriptionExpiryDate < now() 的用户
 *   - 一次性 updateMany 降级为 FREE
 *   - 输出处理数量
 *
 * 安全：要求 Authorization: Bearer <CRON_SECRET> 头，否则 401
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function logCron(eventType: string, status: string, detail: Record<string, unknown>) {
  await prisma.webhookLog.create({
    data: {
      source: "cron",
      eventType,
      status,
      rawBody: JSON.stringify(detail),
    },
  }).catch((err: unknown) => {
    console.error(`[cron/${eventType}] 日志写入失败:`, err)
  })
}

export async function GET(req: Request) {
  // Bearer token 校验
  const authHeader = req.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected) {
    console.error("[cron/expire-sweep] CRON_SECRET 未配置，拒绝执行")
    return NextResponse.json({ error: "服务端配置缺失：CRON_SECRET not configured" }, { status: 500 })
  }
  if (!authHeader || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
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
    console.log(`[cron/expire-sweep] ${result.count} 个 PRO 用户已降级为 FREE（截至 ${now.toISOString()}）`)
    await logCron("expire-sweep", "processed", { count: result.count, executedAt: now.toISOString() })
    return NextResponse.json({
      success: true,
      count: result.count,
      message: `成功降级 ${result.count} 个过期 PRO 用户`,
    })
  } catch (err: unknown) {
    console.error("[cron/expire-sweep] 失败:", err)
    await logCron("expire-sweep", "failed", { error: String(err), executedAt: new Date().toISOString() })
    return NextResponse.json({ error: "执行失败，请查看服务端日志" }, { status: 500 })
  }
}
