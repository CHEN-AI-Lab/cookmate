import { handlers, runWithRequestCookie } from "@/lib/auth"
import type { NextRequest } from "next/server"
import { hasDemoCookie, DEMO_SESSION, buildClearDemoCookieHeader } from "@cookmate/shared/utils/demo-cookie"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)

  // 拦截 session 请求：如果 demo cookie 存在，返回 demo session
  if (url.pathname.endsWith("/session")) {
    const cookieHeader = req.headers.get("cookie")
    if (await hasDemoCookie(cookieHeader)) {
      return Response.json(DEMO_SESSION)
    }
  }

  return runWithRequestCookie(req.headers.get("cookie") ?? "", () => handlers.GET(req))
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)

  // 拦截 signout 请求：清除 demo cookie
  if (url.pathname.endsWith("/signout")) {
    const res = await runWithRequestCookie(req.headers.get("cookie") ?? "", () => handlers.POST(req))
    // 不管 signout 是否成功，都清除 demo cookie
    const headers = new Headers(res.headers)
    headers.append("Set-Cookie", buildClearDemoCookieHeader())
    return new Response(res.body, { status: res.status, headers })
  }

  return runWithRequestCookie(req.headers.get("cookie") ?? "", () => handlers.POST(req))
}