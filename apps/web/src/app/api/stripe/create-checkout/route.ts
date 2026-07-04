import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID
  const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  // Stripe 未配置：返回提示
  if (!STRIPE_SECRET_KEY || !NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return NextResponse.json(
      { error: "支付系统正在配置中，上线后即可使用" },
      { status: 503 }
    )
  }

  try {
    const { tier } = await req.json()
    if (tier !== "pro") {
      return NextResponse.json({ error: "无效的订阅计划" }, { status: 400 })
    }

    const priceId = STRIPE_PRO_PRICE_ID
    if (!priceId) {
      return NextResponse.json(
        { error: `订阅计划 ${tier} 的价格 ID 未配置` },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // 获取或创建 Stripe Customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true, name: true },
    })
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { userId: session.user.id },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // 创建 Checkout Session
    const checkout = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/billing?success=true`,
      cancel_url: `${appUrl}/app/billing?canceled=true`,
      metadata: { userId: session.user.id, tier },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error?.message || "创建支付会话失败" },
      { status: 500 }
    )
  }
}