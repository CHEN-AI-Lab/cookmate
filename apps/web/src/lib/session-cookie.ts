import { decode } from "next-auth/jwt"
import { hasSessionCookieHeader, SESSION_COOKIE_BASES } from "@cookmate/shared/utils/demo-guard"

/**
 * 会话 cookie 的「真伪验证」（Edge 兼容，middleware 与路由共用）。
 *
 * 为什么需要它：体验态判定如果只看「cookie 里有没有叫 authjs.session-token 的名字」，
 * 攻击者在自己浏览器塞一个同名垃圾值，就能让判定失效、绕过 middleware 的集中写拦截。
 * 这里用 NextAuth 自己的 decode 做真实验签（含分片 cookie 拼接），验不出来就视为没有真实会话。
 *
 * 注意：本模块会被 Edge middleware 引用，禁止 import prisma / node:crypto 等 Node-only 依赖。
 */

/** 解析 Cookie 请求头（name=value; ...）→ 普通对象。值不解码（JWT 为 base64url，无需转义） */
export function parseCookieHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=")
    if (idx <= 0) continue
    const name = pair.slice(0, idx).trim()
    const value = pair.slice(idx + 1).trim()
    if (name) out[name] = value
  }
  return out
}

/**
 * 从 Cookie 头里取会话 token（含分片拼接）并解码，返回 userId。
 * 解不出来（没有 / 伪造 / 签名不符 / 过期 / 缺 secret）一律返回 null。
 */
export async function decodeSessionUserIdFromCookieHeader(cookieHeader: string | null): Promise<string | null> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error("[session-cookie] 缺少 AUTH_SECRET / NEXTAUTH_SECRET")
    return null
  }
  try {
    const parsed = parseCookieHeader(cookieHeader ?? "")
    for (const base of SESSION_COOKIE_BASES) {
      const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const full = parsed[base]
      if (full) {
        const decoded = await decode({ token: full, salt: base, secret })
        if (decoded?.sub) return decoded.sub
      }
      // 分片拼接：__Secure-authjs.session-token.0 / .1 ...
      const indices: number[] = []
      for (const key of Object.keys(parsed)) {
        const m = key.match(new RegExp(`^${escaped}\\.(\\d+)$`))
        if (m) indices.push(Number(m[1]))
      }
      if (indices.length > 0) {
        indices.sort((a, b) => a - b)
        const token = indices.map((i) => parsed[`${base}.${i}`]).join("")
        const decoded = await decode({ token, salt: base, secret })
        if (decoded?.sub) return decoded.sub
      }
    }
  } catch (e) {
    console.error("[session-cookie] 从请求头解码 session 异常:", e)
  }
  return null
}

/**
 * 是否存在「验证过的真实登录会话」。
 *
 * ⚠️ 没有 AUTH_SECRET 时（如本地开发）退回旧的存在性判断 —— 此刻无法验签，
 * 宁可放行也不能把真实用户拦下来（fail-open）；生产环境必然配了 secret，走真实验签。
 * 另外：没有 demo cookie 的请求根本不该调本函数（middleware 里已短路），真实用户零额外开销。
 */
export async function hasVerifiedSessionCookie(cookieHeader: string | null): Promise<boolean> {
  if (!hasSessionCookieHeader(cookieHeader)) return false
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) return true
  return (await decodeSessionUserIdFromCookieHeader(cookieHeader)) !== null
}
