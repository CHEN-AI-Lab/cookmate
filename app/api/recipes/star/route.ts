import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: session.user.id, starred: true },
      orderBy: { updatedAt: "desc" },
    }).catch(() => [])
    return NextResponse.json({ recipes })
  } catch (error) {
    console.error("Get starred recipes error:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  try {
    const { recipeId } = await req.json()
    if (!recipeId) return NextResponse.json({ error: "缺少菜谱ID" }, { status: 400 })

    // 查菜谱，只能操作自己的
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, userId: session.user.id },
    }).catch(() => null)
    if (!recipe) return NextResponse.json({ error: "菜谱不存在" }, { status: 404 })

    // 切换收藏状态
    const updated = await prisma.recipe.update({
      where: { id: recipeId },
      data: { starred: !recipe.starred },
    }).catch(() => null)

    return NextResponse.json({ success: true, starred: updated.starred })
  } catch (error) {
    console.error("Star recipe error:", error)
    return NextResponse.json({ error: "操作失败" }, { status: 500 })
  }
}