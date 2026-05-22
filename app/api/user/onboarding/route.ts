import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      dietType: true,
      cuisinePref: true,
      servingSize: true,
      _count: { select: { pantryItems: true, recipes: true } },
    },
  })

  // 已有数据的老用户自动跳过引导
  const hasData = (user?._count.pantryItems ?? 0) > 0 || (user?._count.recipes ?? 0) > 0
  if (hasData && !user?.onboardingCompleted) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    })
    return NextResponse.json({
      onboardingCompleted: true,
      dietType: user?.dietType ?? "不限",
      cuisinePref: user?.cuisinePref ?? "不限",
      servingSize: user?.servingSize ?? 2,
    })
  }

  return NextResponse.json({
    onboardingCompleted: user?.onboardingCompleted ?? false,
    dietType: user?.dietType ?? "不限",
    cuisinePref: user?.cuisinePref ?? "不限",
    servingSize: user?.servingSize ?? 2,
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  const body = await req.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      dietType: body.dietType ?? "不限",
      cuisinePref: body.cuisinePref ?? "不限",
      servingSize: body.servingSize ?? 2,
      onboardingCompleted: true,
    },
  })

  return NextResponse.json({ success: true })
}