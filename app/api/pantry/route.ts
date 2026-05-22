import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const items = await prisma.pantryItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Pantry GET:", error)
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

    const body = await req.json()

    // 批量添加
    if (body.items && Array.isArray(body.items)) {
      const created = []
      for (const item of body.items) {
        const name = (item.name || "").trim()
        if (!name) continue
        const exists = await prisma.pantryItem.findFirst({
          where: { name: name.toLowerCase(), userId: session.user.id },
        })
        if (exists) continue
        const createdItem = await prisma.pantryItem.create({
          data: {
            userId: session.user.id,
            name,
            category: item.category || null,
            quantity: item.quantity || null,
          },
        })
        created.push(createdItem)
      }
      return NextResponse.json({ items: created, count: created.length })
    }

    // 单个添加
    const { name, category, quantity } = body
    if (!name?.trim()) return NextResponse.json({ error: "请输入食材名称" }, { status: 400 })

    const existing = await prisma.pantryItem.findFirst({ where: { name: name.trim().toLowerCase(), userId: session.user.id } })
    if (existing) return NextResponse.json({ error: "该食材已存在" }, { status: 400 })

    const item = await prisma.pantryItem.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        category: category || null,
        quantity: quantity || null,
      },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Pantry POST:", error)
    return NextResponse.json({ error: "请求失败，请稍后重试" }, { status: 500 })
  }
}