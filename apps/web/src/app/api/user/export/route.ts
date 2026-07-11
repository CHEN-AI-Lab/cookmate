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
      select: { name: true, email: true, phone: true, subscriptionTier: true, dietType: true, cuisinePref: true, servingSize: true, createdAt: true },
    }),
    prisma.recipe.findMany({ where: { userId: session.user.id }, select: { title: true, description: true, ingredients: true, steps: true, cookingTime: true, calories: true, cuisineType: true, difficulty: true, starred: true, createdAt: true } }),
    prisma.mealPlan.findMany({ where: { userId: session.user.id }, include: { slots: { include: { recipe: { select: { title: true } } } } } }),
    prisma.pantryItem.findMany({ where: { userId: session.user.id }, select: { name: true, category: true, quantity: true } }),
    prisma.groceryItem.findMany({ where: { userId: session.user.id }, select: { name: true, checked: true } }),
    prisma.paymentOrder.findMany({ where: { userId: session.user.id }, select: { orderId: true, channel: true, amount: true, status: true, createdAt: true } }),
  ])

  const fmt = (d: Date | string | null | undefined) => d ? new Date(d).toLocaleDateString("zh-CN") : "-"

  const exportData = {
    exportInfo: {
      exportedAt: new Date().toISOString(),
      platform: "CookMate",
      version: "1.0",
      description: "这是您的 CookMate 数据导出文件，包含您的账号信息、菜谱、周计划等所有数据。",
    },
    account: user ? {
      name: user.name || "-",
      email: user.email || "-",
      phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "-",
      plan: user.subscriptionTier === "PRO" ? "Pro 专业版" : "Free 免费版",
      dietType: user.dietType || "不限",
      cuisinePref: user.cuisinePref || "不限",
      servingSize: `${user.servingSize} 人份`,
      registeredAt: fmt(user.createdAt),
    } : null,
    statistics: {
      totalRecipes: recipes.length,
      starredRecipes: recipes.filter((r) => r.starred).length,
      totalPantryItems: pantryItems.length,
      totalGroceryItems: groceryItems.length,
      totalMealPlans: mealPlans.length,
      totalOrders: orders.length,
    },
    recipes: recipes.map((r) => ({
      title: r.title,
      description: r.description || "",
      cuisineType: r.cuisineType || "-",
      difficulty: r.difficulty || "-",
      cookingTime: r.cookingTime ? `${r.cookingTime} 分钟` : "-",
      calories: r.calories ? `${r.calories} 千卡` : "-",
      starred: r.starred ? "⭐ 已收藏" : "未收藏",
      ingredients: r.ingredients,
      steps: r.steps,
      createdAt: fmt(r.createdAt),
    })),
    mealPlans: mealPlans.map((mp) => ({
      weekStart: fmt(mp.weekStart),
      slots: mp.slots.map((s) => ({
        dayOfWeek: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][s.dayOfWeek] || "未知",
        mealType: { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" }[s.mealType] || s.mealType,
        recipe: s.recipe?.title || "-",
        note: s.note || "",
      })),
    })),
    pantry: pantryItems.map((p) => ({
      name: p.name,
      category: p.category || "-",
      quantity: p.quantity || "-",
    })),
    groceryList: groceryItems.map((g) => ({
      name: g.name,
      status: g.checked ? "✅ 已购" : "待购买",
    })),
    orders: orders.map((o) => ({
      orderId: o.orderId,
      channel: o.channel,
      amount: `¥${(o.amount / 100).toFixed(2)}`,
      status: { PENDING: "待支付", PAID: "已支付", EXPIRED: "已过期", REFUNDED: "已退款" }[o.status] || o.status,
      date: fmt(o.createdAt),
    })),
  }

  return NextResponse.json(exportData)
}