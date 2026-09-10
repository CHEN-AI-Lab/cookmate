// 体验态写接口「路由级守卫」测试
//
// 为什么需要这一层：proxy.ts 的集中拦截用 isDemoOnlyRequest = 「有 demo cookie 且无 session cookie」判断。
// 攻击者在自己浏览器里塞一个垃圾 authjs.session-token cookie，该判断即返回 false，集中拦截被绕过；
// 而 lib/auth.ts 的 auth() 仍会从「签名有效的 demo cookie」还原出体验态会话。
// 因此每个写入口必须自己再拦一道 —— 伪造 cookie 也绕不过去。
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetPrisma } from './_helpers/mock-prisma'

vi.mock('@/lib/prisma', async () => {
  const { prismaMock } = await import('./_helpers/mock-prisma')
  return { prisma: prismaMock }
})
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@cookmate/shared/api/openai', () => ({
  generateRecipes: vi.fn(),
  generateWeeklyPlan: vi.fn(),
  hasAIKeyForTier: () => false,
  getModelForTier: () => '',
  normalizeIngredients: (x: any) => x,
}))

import { auth } from '@/lib/auth'

import { POST as manualPOST, DELETE as manualDELETE } from '@/app/api/grocery-list/manual/route'
import { POST as purchasePOST, DELETE as purchaseDELETE } from '@/app/api/grocery-list/purchase/route'
import { POST as planAddPOST } from '@/app/api/meal-plan/add/route'
import { POST as planDeletePOST } from '@/app/api/meal-plan/delete/route'
import { PATCH as planSlotPATCH } from '@/app/api/meal-plan/slot/route'
import { DELETE as planSlotIdDELETE } from '@/app/api/meal-plan/slot/[id]/route'
import { DELETE as orderDELETE } from '@/app/api/orders/[orderId]/route'
import { PATCH as pantryPATCH, DELETE as pantryDELETE } from '@/app/api/pantry/[id]/route'
import { DELETE as recipesDELETE } from '@/app/api/recipes/route'
import { DELETE as recipeDELETE } from '@/app/api/recipes/[id]/route'
import { PATCH as recipeStarPATCH } from '@/app/api/recipes/[id]/star/route'
import { PATCH as starPATCH } from '@/app/api/recipes/star/route'
import { POST as generatePOST } from '@/app/api/recipes/generate/route'

const DEMO = { user: { id: 'demo-user-id', email: 'demo@cookmate.local' } }
const REAL = { user: { id: 'u1', email: 'a@b.com' } }

const req = (method = 'POST') => new Request('http://localhost/api/x', { method })
const withParams = { params: Promise.resolve({ id: 'x', orderId: 'x' }) }

beforeEach(() => {
  resetPrisma()
  ;(auth as any).mockResolvedValue(DEMO)
})

/** 收集 16 个写入口，逐个断言体验态被 403 挡下 */
const CASES: [string, (r: Request, p: any) => Promise<Response>][] = [
  ['grocery-list/manual POST', (r, p) => manualPOST(r)],
  ['grocery-list/manual DELETE', (r, p) => manualDELETE(r)],
  ['grocery-list/purchase POST', (r, p) => purchasePOST(r)],
  ['grocery-list/purchase DELETE', (r, p) => purchaseDELETE(r)],
  ['meal-plan/add POST', (r, p) => planAddPOST(r)],
  ['meal-plan/delete POST', (r, p) => planDeletePOST(r)],
  ['meal-plan/slot PATCH', (r, p) => planSlotPATCH(r)],
  ['meal-plan/slot/[id] DELETE', (r, p) => planSlotIdDELETE(r, p)],
  ['orders/[orderId] DELETE', (r, p) => orderDELETE(r, p)],
  ['pantry/[id] PATCH', (r, p) => pantryPATCH(r, p)],
  ['pantry/[id] DELETE', (r, p) => pantryDELETE(r, p)],
  ['recipes DELETE', (r, p) => recipesDELETE(r)],
  ['recipes/[id] DELETE', (r, p) => recipeDELETE(r, p)],
  ['recipes/[id]/star PATCH', (r, p) => recipeStarPATCH(r, p)],
  ['recipes/star PATCH', (r, p) => starPATCH(r)],
  ['recipes/generate POST', (r, p) => generatePOST(r)],
]

describe('体验态写入口：路由级守卫（防伪造 session cookie 绕过 middleware）', () => {
  it('共覆盖 16 个写入口', () => {
    expect(CASES).toHaveLength(16)
  })

  for (const [name, call] of CASES) {
    it(`${name} → 403 且带 demoRestricted 标记`, async () => {
      const res = await call(req(), withParams)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.demoRestricted).toBe(true)
    })
  }

  it('守卫在鉴权之后、业务逻辑之前：体验态不会触库', async () => {
    // 请求体为空，若守卫没拦住会先撞 JSON 解析/参数校验（400）或落库，不可能是 403
    const res = await manualPOST(new Request('http://localhost/api/x', { method: 'POST' }))
    expect(res.status).toBe(403)
  })

  it('真实用户不被守卫误伤', async () => {
    ;(auth as any).mockResolvedValue(REAL)
    // 传合法 JSON 但缺 name → 走到参数校验返回 400，而不是守卫的 403
    const res = await manualDELETE(
      new Request('http://localhost/api/x', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('未登录仍先返回 401（守卫不改变既有鉴权顺序）', async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await manualPOST(req())
    expect(res.status).toBe(401)
  })
})
