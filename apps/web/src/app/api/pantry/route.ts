import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"
import { isValidIngredient } from "@cookmate/shared/validators"
import { isFreeUser, checkPantryLimit, isDemoUser } from "@/lib/auth-helpers"

export async function GET(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in first" }, { status: 401 })

    const items = await prisma.pantryItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }).catch((err: unknown) => { console.error("findMany pantry items error:", err); return [] })

    return NextResponse.json({ items, isDemoUser: isDemoUser(session) })
  } catch (error) {
    console.error("Pantry GET:", error)
    return NextResponse.json({ error: err(loc, "requestFailed") }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Please log in first" }, { status: 401 })

    // 免费版食材库上限（入口先兜一次，避免任何写库动作）
    const isFree = await isFreeUser(session.user.id)
    if (isFree) {
      const limited = await checkPantryLimit(session.user.id)
      if (limited) {
        return NextResponse.json({ error: err(loc, "pantryLimitReached") }, { status: 403 })
      }
    }

    const body = await req.json()

    // 批量添加
    if (body.items && Array.isArray(body.items)) {
      const created = []
      const skipped = []
      let blocked = 0
      for (const item of body.items) {
        const name = (item.name || "").trim().toLowerCase()
        if (!name) continue
        // 逐条检查上限：原先只在循环外查一次，有 14 条时传 50 个会全部写入，
        // 最终 64 条直接突破 15 条上限。这里每条写库前重新判断当前实际条数。
        if (isFree) {
          const nowLimited = await checkPantryLimit(session.user.id)
          if (nowLimited) {
            blocked++
            continue
          }
        }
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
      return NextResponse.json({
        items: created.filter(Boolean),
        count: created.filter(Boolean).length,
        skipped,
        skippedCount: skipped.length,
        // 因达到免费版上限而拒绝写入的条数，前端可据此提示用户升级
        blocked,
        blockedCount: blocked,
      })
    }

    // 单个添加
    const { name, category, quantity } = body
    const normalizedName = (name || "").trim().toLowerCase()
    if (!normalizedName) return NextResponse.json({ error: err(loc, "enterIngredientName") }, { status: 400 })

    // 输入校验：挡住纯数字、纯符号、单字符（如"123"）这类无意义名称，规则与前端一致
    if (!isValidIngredient(normalizedName)) {
      return NextResponse.json({ error: err(loc, "invalidIngredients") }, { status: 400 })
    }

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
