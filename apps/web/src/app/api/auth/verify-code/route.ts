import { NextResponse } from "next/server"
import { signIn } from "@/lib/auth"
import { getLocaleFromCookie, err } from "@cookmate/shared/utils/locale"

export async function POST(req: Request) {
  const loc = getLocaleFromCookie(req)
  try {
    const { phone, email, code, agreeTerms } = await req.json()
    const identifier = phone || email
    if (!identifier || !code) {
      return NextResponse.json({ error: err(loc, "emptyPhoneAndCode") }, { status: 400 })
    }

    const provider = phone ? "phone" : "email"

    // 通过 Credentials provider 登录
    const result = await signIn(provider, {
      phone: phone || "",
      email: email || "",
      code,
      agreeTerms: agreeTerms ? "true" : "false",
      redirect: false,
    })

    if (result?.error) {
      return NextResponse.json(
        { error: result.error === "CredentialsSignin" ? err(loc, "verifyFailed") : result.error },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: err(loc, "sendFailed") }, { status: 500 })
  }
}