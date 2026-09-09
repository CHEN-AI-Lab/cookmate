import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const userId = session.user.id
  const body = await request.json()
  const provider = body?.provider as string

  if (!provider) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 })
  }

  // 邮箱验证码/手机号验证码登录永远不可解绑——保底方式
  if (["email", "phone", "credentials", "password"].includes(provider)) {
    return NextResponse.json({ error: "该登录方式不可解绑" }, { status: 400 })
  }

  // 拿到当前用户所有绑定方式和密码状态
  const [accounts, user] = await Promise.all([
    prisma.account.findMany({ where: { userId }, select: { id: true, provider: true, refresh_token: true, access_token: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
  ])

  const hasPassword = !!user?.passwordHash
  const oauthProviders = ["google", "github", "alipay", "wechat"]
  const oauthAccounts = accounts.filter((a) => oauthProviders.includes(a.provider))

  const account = accounts.find((a) => a.provider === provider)
  if (!account) {
    return NextResponse.json({ error: "未找到该绑定" }, { status: 404 })
  }

  // 解绑后必须还有 ≥1 种登录方式
  const remainingOauth = oauthAccounts.filter((a) => a.provider !== provider)
  if (remainingOauth.length === 0 && !hasPassword) {
    return NextResponse.json({ error: "至少需要保留一种登录方式" }, { status: 400 })
  }

  // Google：先调官方 revoke API 取消 Google 那边的授权
  if (provider === "google") {
    const token = account.refresh_token || account.access_token
    if (token) {
      try {
        await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `token=${encodeURIComponent(token)}`,
        })
      } catch {
        // revoke 失败也继续
      }
    }
  }

  // 删除数据库记录
  await prisma.account.delete({ where: { id: account.id } })

  // GitHub 没有服务端解绑 API，需要手动取消授权
  const needsManualRevoke = provider === "github"

  return NextResponse.json({ ok: true, needsManualRevoke })
}