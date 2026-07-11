import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isDemoUser } from "@/lib/auth-helpers"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 })
  }
  if (isDemoUser(session)) {
    return NextResponse.json({ error: "体验用户不支持此操作" }, { status: 403 })
  }

  const [user, recipes, mealPlans, pantryItems, groceryItems, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true, subscriptionTier: true, dietType: true, cuisinePref: true, servingSize: true, createdAt: true },
    }),
    prisma.recipe.findMany({ where: { userId: session.user.id }, select: { title: true, description: true, ingredients: true, steps: true, cookingTime: true, calories: true, cuisineType: true, difficulty: true, starred: true, createdAt: true } }),
    prisma.mealPlan.findMany({ where: { userId: session.user.id }, include: { slots: { include: { recipe: { select: { title: true } } } } } }),
    prisma.pantryItem.findMany({ where: { userId: session.user.id }, select: { name: true, category: true, quantity: true } }),
    prisma.groceryItem.findMany({ where: { userId: session.user.id }, select: { name: true, checked: true } }),
    prisma.paymentOrder.findMany({ where: { userId: session.user.id }, select: { orderId: true, channel: true, amount: true, status: true, createdAt: true } }),
  ])

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user,
    recipes,
    mealPlans,
    pantryItems,
    groceryItems,
    orders,
  })
}
