import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { classifyIngredient, normalizeIngredientName } from "@cookmate/shared/utils/grocery-categories"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  try {
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "缺少物品名称" }, { status: 400 })

    const trimmedName = name.trim()
    // 归一化：去掉数量后缀和括号克数，确保食材库名字干净
    const cleanName = normalizeIngredientName(trimmedName)
    const category = classifyIngredient(cleanName)

    // upsert: 唯一约束保证不会重复创建，即使并发请求也不会有问题
    const item = await prisma.pantryItem.upsert({
      where: {
        userId_name: { userId: session.user.id, name: cleanName },
      },
      create: {
        userId: session.user.id,
        name: cleanName,
        category: category === "其他" ? null : category,
      },
      update: {}, // 已存在则不做修改
    })

    // 通过 created_at 是否等于 updated_at 判断是新增还是已存在
    const isNew = item.createdAt.getTime() === item.updatedAt.getTime()

    return NextResponse.json({ success: true, alreadyExists: !isNew, item })
  } catch (error) {
    console.error("Grocery purchase error:", error)
    return NextResponse.json({ error: "添加到食材库失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 })

  try {
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: "缺少物品名称" }, { status: 400 })

    // 删除该用户同名的食材库条目
    await prisma.pantryItem.deleteMany({
      where: {
        userId: session.user.id,
        name: name.trim(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Grocery purchase DELETE error:", error)
    return NextResponse.json({ error: "从食材库移除失败" }, { status: 500 })
  }
}

// purchase/route.ts 使用 @/lib/grocery-categories 中的 classifyIngredient 和 normalizeIngredientName
// 注：手动添加食材到食材库时使用同一份分类逻辑