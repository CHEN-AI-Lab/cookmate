/**
 * 取消订阅对账脚本
 * ───────────────────────────────────────────────────────────────────────────
 * 背景：CookMate 取消订阅走「fail-closed」策略 —— 当 Creem 上游取消 API
 * 偶发失败时，本地订阅ID 故意保留（便于 webhook 到期降级 + 可重试），同时在
 * WebhookLog 写入一条 source='cancel'、status='failed' 的审计记录。
 *
 * 本脚本扫描所有「失败」的取消记录，列出谁、哪个渠道、哪个订阅、何时、什么错误，
 * 方便第一时间发现并去 Creem 后台补刀（或让用户重新点一次「取消」即可重试，
 * 因为本地订阅ID 仍保留着）。
 *
 * 运行（无需安装任何依赖，node 直接跑）：
 *   cd cookmate
 *   node scripts/reconcile-cancellations.mjs
 *   # 或： pnpm reconcile:cancellations
 *
 * 依赖：运行时能从环境变量拿到 DATABASE_URL（与 Next 运行时一致；Prisma Client 会自动读取 .env）。
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function parseRaw(rawBody) {
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

function pad(s, n) {
  s = String(s)
  return s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n)
}

async function main() {
  const [failed, completedCount] = await Promise.all([
    prisma.webhookLog.findMany({
      where: { source: "cancel", status: "failed" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.webhookLog.count({ where: { source: "cancel", status: "completed" } }),
  ])

  console.log("＝＝＝ 取消订阅对账 ＝＝＝")
  console.log(`成功取消记录（completed）：${completedCount}`)
  console.log(`失败取消记录（failed） ：${failed.length}`)
  console.log("")

  if (failed.length === 0) {
    console.log("✅ 没有失败的取消，无需处理。")
    return
  }

  const widths = [3, 8, 22, 12, 21, 40]
  const cols = ["#", "渠道", "订阅ID", "用户ID", "时间(UTC)", "错误"]
  console.log(cols.map((c, i) => pad(c, widths[i])).join("  "))
  console.log("-".repeat(widths.reduce((a, b) => a + b, 0) + cols.length * 2))

  failed.forEach((l, i) => {
    const p = parseRaw(l.rawBody)
    const time = (l.createdAt ? new Date(l.createdAt) : new Date())
      .toISOString()
      .replace("T", " ")
      .slice(0, 19)
    console.log(
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

  console.log("")
  console.log("处理建议（fail-closed：本地订阅ID 仍保留，随时可补）：")
  console.log("  1) 直接让用户重新点一次「取消订阅」→ 后端会重试上游取消，成功即闭环；")
  console.log("  2) 或登录对应后台手动取消，避免下个周期继续扣费：")
  console.log("     · Creem：https://www.creem.io/dashboard → Subscriptions")
}

main()
  .catch((e) => {
    console.error("对账脚本执行失败：", e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
