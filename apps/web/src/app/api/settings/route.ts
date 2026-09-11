import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { isDemoUser } from "@/lib/auth-helpers"
import { SUBSCRIPTION_TIER } from "@cookmate/shared/constants"
import { effectiveTier } from "@cookmate/shared/utils/subscription"

export async function GET(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dietType: true, cuisinePref: true, servingSize: true, subscriptionTier: true, subscriptionExpiryDate: true },
    }).catch((err: unknown) => { console.error("findUnique user error:", err); return null })

    // 返回默认值，避免前端显示为空（但cuisinePref为空表示没选）
    return NextResponse.json({
      settings: {
        dietType: user?.dietType ?? "不限",
        cuisinePref: user?.cuisinePref && user.cuisinePref !== "不限" ? user.cuisinePref : "",
        servingSize: user?.servingSize ?? 2,
        // 到期感知：设置页的套餐标识要和账单页（dashboard 的实时口径）一致，
        // 否则会出现「账单页说免费版、设置页说 Pro」。
        subscriptionTier: user
          ? effectiveTier(user.subscriptionTier, user.subscriptionExpiryDate)
          : SUBSCRIPTION_TIER.FREE,
      },
    })
  } catch (error) {
    console.error("Settings GET:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })
    if (isDemoUser(session)) return NextResponse.json({ error: "体验用户不支持修改设置，请注册后使用" }, { status: 403 })

    const { dietType, cuisinePref, servingSize } = await req.json()

    // 确保 servingSize 为数字
    const validatedServingSize = servingSize !== undefined ? Number(servingSize) : undefined

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        dietType: dietType ?? undefined,
        cuisinePref: cuisinePref ?? undefined,
        servingSize: validatedServingSize,
      },
    }).catch((err: unknown) => { console.error("update user error:", err); return null })

    return NextResponse.json({
      settings: { dietType: user?.dietType, cuisinePref: user?.cuisinePref, servingSize: user?.servingSize ?? 2 },
    })
  } catch (error) {
    console.error("Settings PUT:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}