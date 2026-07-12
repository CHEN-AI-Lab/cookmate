import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in first" }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const starredParam = searchParams.get("starred")
    const search = searchParams.get("search")?.trim() || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.max(1, Math.min(1000, parseInt(searchParams.get("pageSize") || "1000")))

    const where: Record<string, unknown> = { userId: session.user.id }
    if (starredParam === "true") {
      where.starred = true
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { ingredients: { contains: search } },
        { cuisineType: { contains: search } },
      ]
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }).catch((err: unknown) => { console.error("findMany recipes error:", err); return [] }),
      prisma.recipe.count({ where }).catch((err: unknown) => { console.error("count recipes error:", err); return 0 }),
    ])

    return NextResponse.json({ recipes, total, page, pageSize })
  } catch (error) {
    console.error("GET recipes error:", error)
    return NextResponse.json({ error: "获取失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in first" }, { status: 401 })
  try {
    let body: { ids?: string[] } = {}
    try {
      body = await req.json()
    } catch (err) {
      console.error("parse request body error:", err)
      return NextResponse.json({ error: "请提供要删除的菜谱 ID 列表" }, { status: 400 })
    }

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "请提供要删除的菜谱 ID 列表" }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId: session.user.id, id: { in: body.ids } }

    const result = await prisma.recipe.deleteMany({ where })
    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error("Clear recipes error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}