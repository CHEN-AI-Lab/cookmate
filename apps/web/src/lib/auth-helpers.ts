import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export function isDemoUser(session: { user?: { id?: string; email?: string; [key: string]: unknown } } | null): boolean {
  return !!session && (session.user?.id === "demo-user-id" || session.user?.email === "demo@cookmate.local")
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function checkUsageLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  if (!user) return false
  if (user.subscriptionTier !== "FREE") return true

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const usage = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date: today } },
  })
  return (usage?.recipeCount ?? 0) < 1
}

export async function incrementUsage(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date: today } },
    update: { recipeCount: { increment: 1 } },
    create: { userId, date: today, recipeCount: 1 },
  })
}