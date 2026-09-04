/**
 * Cron 路由：取消订阅对账
 * ───────────────────────────────────────────────────────────────────────────
 * 触发方式：Vercel Cron 定时调用（通过 vercel.json headers 自动带 Bearer token），或手动 curl -H "Authorization: Bearer ***"
 *
 * 功能：
 *   - 扫描所有 WebhookLog.source='cancel' & status='failed' 的记录
 *   - 输出失败列表，方便管理员发现并补刀
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

function pad(s: string, n: number): string {
  s = String(s)
  return s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n)
}

function parseRaw(rawBody?: string | null): { userId: string | null; subscriptionId: string | null; error: string } {
  if (!rawBody) return { userId: null, subscriptionId: null, error: "" }
  try {
    const o = JSON.parse(rawBody)
    return {
      userId: o.userId ?? null,
      subscriptionId: o.subscriptionId ?? null,
      error: typeof o.error === "string" ? o.error : String(o.error ?? ""),
    }
  } catch {
    return { userId: null, subscriptionId: null, error: rawBody }
  }
}

export async function POST(req: Request) {
  // Bearer token 校验
  const authHeader = req.headers.get("authorization")
  const expected = process.env.CRON_SECRET
  if (!expected) {
    console.error("[cron/reconcile-cancellations] CRON_SECRET 未配置，拒绝执行")
    return NextResponse.json({ error: "服务端配置缺失：CRON_SECRET not configured" }, { status: 500 })
  }
  if (!authHeader || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  try {
    const [failed, completedCount] = await Promise.all([
      prisma.webhookLog.findMany({
        where: { source: "cancel", status: "failed" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.webhookLog.count({ where: { source: "cancel", status: "completed" } }),
    ])

    const widths = [3, 8, 22, 12, 21, 40]
    const cols = ["#", "渠道", "订阅ID", "用户ID", "时间(UTC)", "错误"]
    const output: string[] = []

    output.push("＝＝＝ 取消订阅对账 ＝＝＝")
    output.push(`成功取消记录（completed）：${completedCount}`)
    output.push(`失败取消记录（failed） ：${failed.length}`)
    output.push("")
    output.push(cols.map((c, i) => pad(c, widths[i])).join("  "))
    output.push("-".repeat(widths.reduce((a, b) => a + b, 0) + cols.length * 2))

    failed.forEach((l, i) => {
      const p = parseRaw(l.rawBody)
      const time = (l.createdAt ? new Date(l.createdAt) : new Date())
        .toISOString()
        .replace("T", " ")
        .slice(0, 19)
      output.push(
        [
          pad(String(i + 1), widths[0]),
          pad(String(l.eventType ?? "-"), widths[1]),
          pad(String(p.subscriptionId ?? "-"), widths[2]),
          pad(String(p.userId ?? "-").slice(0, 12), widths[3]),
          pad(time, widths[4]),
          pad(p.error || "-", widths[5]),
        ].join("  "),
      )
    })

    output.push("")
    output.push("处理建议（fail-closed：本地订阅ID 仍保留，随时可补）：")
    output.push("  1) 直接让用户重新点一次「取消订阅」→ 后端会重试上游取消，成功即闭环；")
    output.push("  2) 或登录对应后台手动取消，避免下个周期继续扣费：")
    output.push("     · Creem：https://www.creem.io/dashboard → Subscriptions")

    const text = output.join("\n")
    console.log(text)
    await logCron("reconcile-cancellations", "processed", { completedCount, failedCount: failed.length, executedAt: new Date().toISOString() })
    return NextResponse.json({
      success: true,
      completedCount,
      failedCount: failed.length,
      report: text,
    })
  } catch (err: unknown) {
    console.error("[cron/reconcile-cancellations] 失败:", err)
    await logCron("reconcile-cancellations", "failed", { error: String(err), executedAt: new Date().toISOString() })
    return NextResponse.json({ error: "执行失败，请查看服务端日志" }, { status: 500 })
  }
}
