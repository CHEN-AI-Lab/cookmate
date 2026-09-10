/**
 * 退出体验模式 —— 清除体验 cookie。
 *
 * 单独开一个接口而不是复用 NextAuth signOut：体验用户没有真实会话，
 * signOut 对他是空操作；而「免费注册 / 去登录」必须先退出体验态，
 * 否则注册成功后写接口仍会被体验模式守卫拦截。
 */
import { NextResponse } from "next/server"
import { buildClearDemoCookieHeader } from "@cookmate/shared/utils/demo-cookie"

export async function POST() {
  const headers = new Headers()
  headers.append("Set-Cookie", buildClearDemoCookieHeader())
  return NextResponse.json({ success: true }, { headers })
}
