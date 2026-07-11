import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { isDemoUser } from "@/lib/auth-helpers"

export async function GET(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: err(loc, "loginRequired") }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dietType: true, cuisinePref: true, servingSize: true, subscriptionTier: true },
    }).catch((err: unknown) => { console.error("findUnique user error:", err); return null })

    // 返回默认值，避免前端显示为空（但cuisinePref为空表示没选）
    return NextResponse.json({
      settings: {
        dietType: user?.dietType ?? "不限",
        cuisinePref: user?.cuisinePref && user.cuisinePref !== "不限" ? user.cuisinePref : "",
        servingSize: user?.servingSize ?? 2,
        subscriptionTier: user?.subscriptionTier ?? "FREE",
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