import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    })

    return NextResponse.json({ onboardingCompleted: user?.onboardingCompleted ?? false })
  } catch {
    return NextResponse.json({ onboardingCompleted: false })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { dietType, cuisinePref, servingSize } = body

    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        dietType: dietType ?? undefined,
        cuisinePref: cuisinePref ?? undefined,
        servingSize: servingSize ?? 2,
        onboardingCompleted: true,
      },
      create: {
        id: session.user.id,
        email: session.user.email || "demo@cookmate.local",
        name: session.user.name || "体验用户",
        dietType: dietType ?? "不限",
        cuisinePref: cuisinePref ?? "",
        servingSize: servingSize ?? 2,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding POST:", error)
    return NextResponse.json({ error: "保存失败" }, { status: 500 })
  }
}