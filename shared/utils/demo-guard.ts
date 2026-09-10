/**
 * 体验模式（Demo）统一守卫
 *
 * 设计原则（业界通行做法，非本项目独创）：
 * 1. 「前端隐藏/禁用按钮」不是安全边界，只是 UX；真实边界必须在服务端。
 * 2. 拦截集中在一处（middleware + 本模块的白名单），而不是每个路由各写一遍 if。
 *    这样「后期新增功能」只要是个写接口就自动受限，不会遗漏。
 * 3. 只放行安全方法（GET/HEAD/OPTIONS）与明确白名单，其余写操作一律 403（默认拒绝）。
 *
 * 注意：本模块会被 Edge middleware 引用，禁止 import node:crypto 等 Node-only 依赖。
 */

/** 体验模式 cookie 名（单一来源：demo-cookie.ts 也从这里取，避免两处硬编码不一致） */
export const DEMO_COOKIE_NAME = 'cookmate_demo'

/** NextAuth 会话 cookie 基础名（生产为 __Secure- 前缀，超长时会分片成 .0/.1） */
const SESSION_COOKIE_BASES = ['authjs.session-token', '__Secure-authjs.session-token']

/** 请求头里是否带体验 cookie（只判存在性，不验签 —— 见 isDemoOnlyRequest 说明） */
export function hasDemoCookieHeader(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false
  return cookieHeader
    .split(';')
    .some((part) => part.trim().startsWith(DEMO_COOKIE_NAME + '='))
}

/** 请求头里是否带真实登录会话 cookie */
export function hasSessionCookieHeader(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false
  return cookieHeader.split(';').some((part) => {
    const name = part.trim().split('=')[0]
    return SESSION_COOKIE_BASES.some((base) => name === base || name.startsWith(base + '.'))
  })
}

/**
 * 是否处于「纯体验态」：有体验 cookie 且没有真实登录会话。
 *
 * 这里刻意只做存在性判断、不校验 HMAC 签名（签名校验在 Node 侧的 hasDemoCookie 做）：
 * - 误判方向是「限制更严」，伪造 cookie 只能让自己被拦，无法提权；
 * - 真实用户即使残留体验 cookie，只要有登录会话就不受影响，不会误伤。
 */
export function isDemoOnlyRequest(cookieHeader: string | null): boolean {
  return hasDemoCookieHeader(cookieHeader) && !hasSessionCookieHeader(cookieHeader)
}

/**
 * 体验模式下允许放行的写接口前缀。
 * NextAuth 自身流程（/api/auth/*）单独放行：体验用户没有真实会话，走不通凭证登录；
 * OAuth 关联则由 auth.ts 的 signIn 回调拦截，这里拦不住 GET 跳转。
 */
export const DEMO_WRITE_ALLOWLIST_PREFIXES: readonly string[] = ['/api/auth/']

export function isDemoWriteAllowed(pathname: string): boolean {
  return DEMO_WRITE_ALLOWLIST_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

/** 安全方法：只读，体验用户照常放行 */
export function isSafeMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
}

/**
 * 体验用户在设置页看到的「已关联第三方账号」假数据。
 * 目的：让前端渲染出「已绑定」状态，从而不再渲染 +Google / +GitHub 关联按钮，
 * 从源头上堵死「体验用户点关联 → 把真实第三方账号绑进来」的路径。
 * 这些 provider 在数据库里并不存在，点击解绑也会被引擎拦截（见 unlink-account 路由）。
 */
export const DEMO_LINKED_ACCOUNTS = [{ provider: 'google' }, { provider: 'github' }]
