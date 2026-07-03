import { NextResponse } from "next/server"
import { signIn } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { phone, email, code } = await req.json()
    const identifier = phone || email
    if (!identifier || !code) {
      return NextResponse.json({ error: "请输入验证码" }, { status: 400 })
    }

    const provider = phone ? "phone" : "email"

    // 通过 Credentials provider 登录
    const result = await signIn(provider, {
      phone: phone || "",
      email: email || "",
      code,
      redirect: false,
    })

    if (result?.error) {
      return NextResponse.json(
        { error: result.error === "CredentialsSignin" ? "验证码错误或已过期" : result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: "验证失败" }, { status: 500 })
  }
}