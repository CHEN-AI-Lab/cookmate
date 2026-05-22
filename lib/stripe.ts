import Stripe from "stripe"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID
const STRIPE_FAMILY_PRICE_ID = process.env.STRIPE_FAMILY_PRICE_ID

if (!STRIPE_SECRET_KEY || !STRIPE_PRO_PRICE_ID || !STRIPE_FAMILY_PRICE_ID) {
  console.warn("Stripe environment variables not configured")
}

export const stripe = new Stripe(STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24" as any,
  typescript: true,
})

export const PRICE_IDS = {
  pro: STRIPE_PRO_PRICE_ID!,
  family: STRIPE_FAMILY_PRICE_ID!,
} as const