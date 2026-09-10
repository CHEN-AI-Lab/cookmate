// 会话 cookie 验签测试：middleware 的体验态判定依赖「真验签」，这里锁死行为。
// 背景：原先只看「cookie 名是否存在」，塞一个同名垃圾值即可让攻击者绕过集中写拦截。
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encode } from 'next-auth/jwt'
import { hasVerifiedSessionCookie, decodeSessionUserIdFromCookieHeader } from '@/lib/session-cookie'
import { DEMO_COOKIE_NAME } from '@cookmate/shared/utils/demo-guard'

const SECRET = 'test-secret-for-session-cookie'
const SALT = 'authjs.session-token'

const cookie = (pairs: Record<string, string>) =>
  Object.entries(pairs).map(([k, v]) => `${k}=${v}`).join('; ')

let savedAuth: string | undefined
let savedNext: string | undefined

beforeEach(() => {
  savedAuth = process.env.AUTH_SECRET
  savedNext = process.env.NEXTAUTH_SECRET
  process.env.AUTH_SECRET = SECRET
  delete process.env.NEXTAUTH_SECRET
})

afterEach(() => {
  if (savedAuth === undefined) delete process.env.AUTH_SECRET
  else process.env.AUTH_SECRET = savedAuth
  if (savedNext === undefined) delete process.env.NEXTAUTH_SECRET
  else process.env.NEXTAUTH_SECRET = savedNext
})

describe('hasVerifiedSessionCookie', () => {
  it('有效会话 cookie → true', async () => {
    const token = await encode({ token: { sub: 'u1' }, secret: SECRET, salt: SALT })
    expect(await hasVerifiedSessionCookie(cookie({ 'authjs.session-token': token }))).toBe(true)
  })

  it('内容相同但用别的 secret 签的（伪造）→ false', async () => {
    const token = await encode({ token: { sub: 'u1' }, secret: 'attacker-secret', salt: SALT })
    expect(await hasVerifiedSessionCookie(cookie({ 'authjs.session-token': token }))).toBe(false)
  })

  it('垃圾值（名字对、内容乱来）→ false ← 这正是原先能绕过集中拦截的口子', async () => {
    expect(await hasVerifiedSessionCookie(cookie({ 'authjs.session-token': 'garbage' }))).toBe(false)
  })

  it('分片 cookie（.0/.1）拼接后 → true', async () => {
    const token = await encode({ token: { sub: 'u1' }, secret: SECRET, salt: SALT })
    const mid = Math.ceil(token.length / 2)
    expect(
      await hasVerifiedSessionCookie(cookie({
        'authjs.session-token.0': token.slice(0, mid),
        'authjs.session-token.1': token.slice(mid),
      }))
    ).toBe(true)
  })

  it('__Secure- 前缀也认（生产环境）', async () => {
    const secureSalt = '__Secure-authjs.session-token'
    const token = await encode({ token: { sub: 'u1' }, secret: SECRET, salt: secureSalt })
    expect(await hasVerifiedSessionCookie(cookie({ [secureSalt]: token }))).toBe(true)
  })

  it('正式用户残留体验 cookie + 有效会话 → true（middleware 绝不能误伤真实用户）', async () => {
    const token = await encode({ token: { sub: 'u1' }, secret: SECRET, salt: SALT })
    expect(
      await hasVerifiedSessionCookie(cookie({
        [DEMO_COOKIE_NAME]: 'anything.sig',
        'authjs.session-token': token,
      }))
    ).toBe(true)
  })

  it('体验 cookie + 垃圾 session cookie → false（这正是要拦的绕过）', async () => {
    expect(
      await hasVerifiedSessionCookie(cookie({
        [DEMO_COOKIE_NAME]: 'anything.sig',
        'authjs.session-token': 'garbage',
      }))
    ).toBe(false)
  })

  it('没有 session cookie → false', async () => {
    expect(await hasVerifiedSessionCookie('cookmate_demo=abc.def')).toBe(false)
    expect(await hasVerifiedSessionCookie(null)).toBe(false)
  })

  it('相似名不误判 → false', async () => {
    expect(await hasVerifiedSessionCookie(cookie({ 'authjs.session-token-x': 'whatever' }))).toBe(false)
  })

  it('没配 secret（本地开发）→ 退回名字存在性判断，不拦真实用户', async () => {
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    expect(await hasVerifiedSessionCookie(cookie({ 'authjs.session-token': 'whatever' }))).toBe(true)
    expect(await hasVerifiedSessionCookie('other=1')).toBe(false)
  })
})

describe('decodeSessionUserIdFromCookieHeader', () => {
  it('有效 cookie → 返回 sub', async () => {
    const token = await encode({ token: { sub: 'u1' }, secret: SECRET, salt: SALT })
    expect(await decodeSessionUserIdFromCookieHeader(cookie({ 'authjs.session-token': token }))).toBe('u1')
  })

  it('解不出来 → null', async () => {
    expect(await decodeSessionUserIdFromCookieHeader(cookie({ 'authjs.session-token': 'garbage' }))).toBeNull()
    expect(await decodeSessionUserIdFromCookieHeader(null)).toBeNull()
  })
})
