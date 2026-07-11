import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"

export async function GET(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const items = await prisma.pantryItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }).catch((err: unknown) => { console.error("findMany pantry items error:", err); return [] })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Pantry GET:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const body = await req.json()

    // 批量添加
    if (body.items && Array.isArray(body.items)) {
      const created = []
      const skipped = []
      for (const item of body.items) {
        const name = (item.name || "").trim().toLowerCase()
        if (!name) continue
        const exists = await prisma.pantryItem.findFirst({
          where: { name, userId: session.user.id },
        }).catch((err: unknown) => { console.error("findFirst pantry item error:", err); return null })
        if (exists) {
          skipped.push(item.name || "")
          continue
        }
        const createdItem = await prisma.pantryItem.create({
          data: {
            userId: session.user.id,
            name,
            category: item.category || null,
            quantity: item.quantity || null,
          },
        }).catch((err: unknown) => { console.error("create pantry item error:", err); return null })
        created.push(createdItem)
      }
      return NextResponse.json({ items: created, count: created.length, skipped, skippedCount: skipped.length })
    }

    // 单个添加
    const { name, category, quantity } = body
    const normalizedName = (name || "").trim().toLowerCase()
    if (!normalizedName) return NextResponse.json({ error: err(loc, "enterIngredientName") }, { status: 400 })

    const existing = await prisma.pantryItem.findFirst({ where: { name: normalizedName, userId: session.user.id } }).catch((err: unknown) => { console.error("findFirst pantry item error:", err); return null })
    if (existing) return NextResponse.json({ error: err(loc, "ingredientExists") }, { status: 400 })

    const item = await prisma.pantryItem.create({
      data: {
        userId: session.user.id,
        name: normalizedName,
        category: category || null,
        quantity: quantity || null,
      },
    }).catch((err: unknown) => { console.error("create pantry item error:", err); return null })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Pantry POST:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}