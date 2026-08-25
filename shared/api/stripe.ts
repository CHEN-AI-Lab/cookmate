import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    })
  }
  return stripeInstance
}

export function getPriceIds() {
  const pro = process.env.STRIPE_PRO_PRICE_ID
  if (!pro) {
    throw new Error("STRIPE_PRO_PRICE_ID is not configured")
  }
  return { pro }
}

/** 取消 Stripe 订阅（立即取消，与 Creem 的 cancelSubscription 语义一致，避免下个周期续费扣款） */
export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  await getStripe().subscriptions.cancel(subscriptionId)
}