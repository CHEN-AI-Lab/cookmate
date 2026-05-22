import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { dietType: true, cuisinePref: true, servingSize: true, subscriptionTier: true },
    })

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
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

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
    })

    return NextResponse.json({
      settings: { dietType: user.dietType, cuisinePref: user.cuisinePref, servingSize: user.servingSize },
    })
  } catch (error) {
    console.error("Settings PUT:", error)
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}