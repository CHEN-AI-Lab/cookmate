import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
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
    if (STRIPE_WEBHOOK_SECRET) {
      // 生产环境：验证签名
      event = getStripe().webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
    } else {
      // 开发环境：直接解析（stripe listen 本地不需要签名验证）
      event = JSON.parse(rawBody)
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
        const items = subscription.items?.data || []
        const priceId = items[0]?.price?.id || ""

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
        console.log("Invoice paid:", event.data.object.id)
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
  } catch (error: any) {
    console.error("Stripe webhook error:", error)
    return NextResponse.json(
      { error: error?.message || "Webhook processing failed" },
      { status: 400 }
    )
  }
}