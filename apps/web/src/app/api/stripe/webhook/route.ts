import { NextResponse } from "next/server"
import { getStripe } from "@cookmate/shared/api/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  try {
    const rawBody = await req.text()
    const signature = req.headers.get("stripe-signature") || ""

    let event
    if (!STRIPE_WEBHOOK_SECRET) {
      // 开发环境未配 secret — 直接解析（仅 NODE_ENV=development 时允许）
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
      }
      event = JSON.parse(rawBody)
    } else {
      // 生产环境：验证签名
      event = getStripe().webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier || "pro"

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: "PRO",
              stripeSubscriptionId: session.subscription as string || null,
              stripeCustomerId: session.customer as string || undefined,
            },
          })
          console.log(`User ${userId} upgraded to ${tier}`)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        // 根据订阅状态更新用户
        const status = subscription.status

        const userTier = status === "active" || status === "trialing" ? "PRO" : "FREE"

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionTier: userTier,
            stripeSubscriptionId: subscription.id,
          },
        })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionTier: "FREE",
            stripeSubscriptionId: null,
          },
        })
        console.log(`User (customer ${customerId}) reverted to FREE`)
        break
      }

      case "invoice.paid": {
        // 支付成功 — 可额外记录
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const email = invoice.customer_email || invoice.customer_name
        console.warn(`Payment failed for ${email || "unknown"}`)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || "Webhook processing failed" },
      { status: 400 }
    )
  }
}