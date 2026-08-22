import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkOtpRateLimit, recordOtpAttempt } from "@cookmate/shared/utils/otp-rate-limit"

export async function POST(req: Request) {
  try {
    const { phone, email, code } = await req.json()
    const identifier = phone || email
    if (!identifier || !code) {
      return NextResponse.json({ error: "请输入验证码" }, { status: 400 })
    }

    // 防爆破：同一标识失败次数过多则锁定
    const rateKey = `otp:${identifier}`
    const rate = checkOtpRateLimit(rateKey)
    if (!rate.allowed) {
      return NextResponse.json({ error: "尝试次数过多，请 15 分钟后再试" }, { status: 429 })
    }

    const record = phone
      ? await prisma.verificationCode.findFirst({
          where: { phone, code, used: false, expiresAt: { gte: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.verificationCode.findFirst({
          where: { email: email!, code, used: false, expiresAt: { gte: new Date() } },
          orderBy: { createdAt: "desc" },
        })

    if (!record) {
      recordOtpAttempt(rateKey, false)
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 401 })
    }
    recordOtpAttempt(rateKey, true)

    // 标记为已使用
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verify code only error:", error)
    return NextResponse.json({ error: "验证失败" }, { status: 500 })
  }
}