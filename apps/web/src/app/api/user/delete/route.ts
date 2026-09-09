import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"
import { cancelSubscription } from "@cookmate/shared/api/creem"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }
    if (isDemoUser(session)) {
      return NextResponse.json({ error: "体验用户不支持此操作" }, { status: 403 })
    }

    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: "请提供邮箱和验证码" }, { status: 400 })
    }

    // 验证邮箱匹配当前用户
    if (!session.user.email || session.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "邮箱不匹配" }, { status: 400 })
    }

    // 验证验证码
    const record = await prisma.verificationCode.findFirst({
      where: { email, code, used: false, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    })
    if (!record) {
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 })
    }

    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    // 删号前先取消上游 Creem 订阅：creemSubscriptionId 会随账号级联删除，
    // 不先取消的话上游会继续按周期扣费、且之后永远无法再取消（真金白银的资损）。
    // fail-closed：取消失败则中止删号，保留订阅ID 便于重试/人工对账（reconcile-cancellations cron 会盯 failed 记录）。
    const delTarget = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creemSubscriptionId: true },
    })
    if (delTarget?.creemSubscriptionId) {
      try {
        await cancelSubscription(delTarget.creemSubscriptionId)
        await prisma.webhookLog.create({
          data: {
            source: "cancel",
            eventType: "creem",
            status: "completed",
            userId: session.user.id,
            subscriptionId: delTarget.creemSubscriptionId,
            rawBody: JSON.stringify({ userId: session.user.id, subscriptionId: delTarget.creemSubscriptionId, context: "account-delete" }),
          },
        }).catch((e: unknown) => { console.error("[delete-cancel-audit-write-failed]", e) })
      } catch (cancelErr) {
        console.error("Delete account: upstream subscription cancel failed, aborting deletion", cancelErr)
        try {
          await prisma.webhookLog.create({
            data: {
              source: "cancel",
              eventType: "creem",
              status: "failed",
              userId: session.user.id,
              subscriptionId: delTarget.creemSubscriptionId,
              rawBody: JSON.stringify({ userId: session.user.id, subscriptionId: delTarget.creemSubscriptionId, context: "account-delete", error: cancelErr instanceof Error ? cancelErr.message : String(cancelErr) }),
            },
          })
        } catch {}
        return NextResponse.json({ error: "取消上游订阅失败，删除已中止，请稍后再试" }, { status: 500 })
      }
    }

    // Cascade delete user and all related data
    await prisma.user.delete({ where: { id: session.user.id } })

    return NextResponse.json({ success: true, message: "账号已永久删除" })
  } catch (error: unknown) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "删除账号失败，请稍后再试" }, { status: 500 })
  }
}