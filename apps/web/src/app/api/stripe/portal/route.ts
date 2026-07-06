import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getStripe } from "@cookmate/shared/api/stripe"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return NextResponse.json(
      { error: "支付系统正在配置中，上线后即可使用" },
      { status: 503 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "您还没有创建订阅，请先订阅" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/app/billing`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (error: unknown) {
    console.error("Stripe portal error:", error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || "创建管理页面失败" },
      { status: 500 }
    )
  }
}