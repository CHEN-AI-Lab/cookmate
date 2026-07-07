import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createCheckout, isCreemConfigured } from "@cookmate/shared/api/creem"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    if (!isCreemConfigured()) {
      return NextResponse.json({ error: "Creem 支付正在配置中" }, { status: 503 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const { checkoutUrl } = await createCheckout({
      successUrl: `${baseUrl}/app/billing?success=true`,
      metadata: { userId: session.user.id },
    })

    return NextResponse.json({ url: checkoutUrl })
  } catch (error: unknown) {
    console.error("Creem checkout error:", error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || "创建支付失败" },
      { status: 500 }
    )
  }
}