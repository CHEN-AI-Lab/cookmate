// 测试用 Prisma 内存假实现（状态可持久，便于断言「升级/降级/幂等」等状态转移）
// 注意：本文件不是 *.test.ts，不会被 vitest 收集为测试，仅供测试文件 import。
import { vi } from 'vitest'

export const stores = {
  users: new Map<string, any>(),
  orders: new Map<string, any>(), // key = orderId
  logs: new Map<string, any>(),
  recipes: new Map<string, any>(),
  mealPlans: new Map<string, any>(),
  mealSlots: [] as any[],
  usage: new Map<string, any>(), // key = `${userId}_${date.getTime()}`
  pantries: new Map<string, any>(), // pantry items by id
  codes: new Map<string, any>(), // verification codes by id
  accounts: [] as any[], // oauth accounts
}

export function resetStores() {
  stores.users.clear()
  stores.orders.clear()
  stores.logs.clear()
  stores.recipes.clear()
  stores.mealPlans.clear()
  stores.mealSlots.length = 0
  stores.usage.clear()
  stores.pantries.clear()
  stores.codes.clear()
  stores.accounts.length = 0
}

function usageKey(userId: string, date: any): string {
  const t = date instanceof Date ? date.getTime() : date
  return `${userId}_${t}`
}

// ── where 条件匹配（对齐真实 Prisma 的常见算子：等值 / in / contains / startsWith / not / 日期区间）──

function matchVal(cond: any, value: any): boolean {
  if (cond === undefined) return true
  if (cond !== null && typeof cond === 'object') {
    if (Array.isArray(cond.in)) return cond.in.includes(value)
    // 对齐真实接口：后台文本筛选一律 mode: "insensitive"（大小写不敏感）
    if (typeof cond.startsWith === 'string') return String(value ?? '').toLowerCase().startsWith(cond.startsWith.toLowerCase())
    if (typeof cond.contains === 'string') return String(value ?? '').toLowerCase().includes(cond.contains.toLowerCase())
    // { not: null } 在 Prisma 里等价于「非空」，undefined 也算空
    if ('not' in cond) return cond.not == null ? value != null : value !== cond.not
    return true
  }
  return value === cond
}

function matchDate(cond: any, value: any): boolean {
  if (!cond) return true
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (cond.gte && !(t >= new Date(cond.gte).getTime())) return false
  if (cond.lte && !(t <= new Date(cond.lte).getTime())) return false
  return true
}

function matchOrder(o: any, where: any): boolean {
  if (!where) return true
  return (
    matchVal(where.userId, o.userId) &&
    matchVal(where.channel, o.channel) &&
    matchVal(where.status, o.status) &&
    matchVal(where.period, o.period) &&
    matchVal(where.externalCheckoutId, o.externalCheckoutId) &&
    matchVal(where.orderId, o.orderId) &&
    matchVal(where.paidAmount, o.paidAmount) &&
    matchDate(where.createdAt, o.createdAt)
  )
}

function matchLog(l: any, where: any): boolean {
  if (!where) return true
  return (
    matchVal(where.source, l.source) &&
    matchVal(where.status, l.status) &&
    matchVal(where.eventType, l.eventType) &&
    matchVal(where.userId, l.userId) &&
    matchVal(where.subscriptionId, l.subscriptionId) &&
    matchVal(where.eventId, l.eventId) &&
    matchDate(where.createdAt, l.createdAt)
  )
}

function matchUser(u: any, where: any): boolean {
  if (!where) return true
  return (
    matchVal(where.email, u.email) &&
    matchVal(where.name, u.name) &&
    matchVal(where.subscriptionTier, u.subscriptionTier) &&
    matchDate(where.createdAt, u.createdAt)
  )
}

/** 用于测试「免费额度已用完」场景：直接种入当天 usage 记录 */
export function seedUsageDaily(userId: string, count: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  stores.usage.set(usageKey(userId, today), { userId, date: today, recipeCount: count })
}

export function makePrisma() {
  return {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return stores.users.get(where.id) || null
        if (where.email) {
          for (const u of stores.users.values()) if (u.email === where.email) return u
          return null
        }
        return null
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        for (const u of stores.users.values()) {
          if (where.creemSubscriptionId && u.creemSubscriptionId === where.creemSubscriptionId) return u
        }
        return null
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const u = stores.users.get(where.id)
        if (!u) throw new Error('User not found: ' + where.id)
        Object.assign(u, data)
        return u
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = data.id || `u_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const rec = { id, ...data }
        stores.users.set(id, rec)
        return rec
      }),
      findMany: vi.fn(async () => []),
      count: vi.fn(async ({ where }: any) => {
        return [...stores.users.values()].filter((u: any) => matchUser(u, where)).length
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        for (const u of stores.users.values()) {
          if (where.subscriptionTier !== undefined && u.subscriptionTier !== where.subscriptionTier) continue
          const lt = where.subscriptionExpiryDate?.lt
          if (lt && !(u.subscriptionExpiryDate && u.subscriptionExpiryDate < lt)) continue
          Object.assign(u, data)
          count++
        }
        return { count }
      }),
      delete: vi.fn(async ({ where }: any) => {
        const u = stores.users.get(where.id)
        if (!u) throw new Error('User not found: ' + where.id)
        stores.users.delete(where.id)
        return u
      }),
    },
    verificationCode: {
      findFirst: vi.fn(async ({ where }: any) => {
        for (const c of stores.codes.values()) {
          if (where.email && c.email !== where.email) continue
          if (where.code && c.code !== where.code) continue
          if (where.used === false && c.used) continue
          if (where.used === true && !c.used) continue
          if (where.expiresAt?.gte && !(c.expiresAt && c.expiresAt >= where.expiresAt.gte)) continue
          if (where.createdAt?.gte && !(c.createdAt && c.createdAt >= where.createdAt.gte)) continue
          return c
        }
        return null
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = `vc_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const rec = { id, used: false, createdAt: new Date(), ...data }
        stores.codes.set(id, rec)
        return rec
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const rec = stores.codes.get(where.id)
        if (!rec) throw new Error('VerificationCode not found: ' + where.id)
        Object.assign(rec, data)
        return rec
      }),
    },
    paymentOrder: {
      findFirst: vi.fn(async ({ where, orderBy }: any) => {
        const list = [...stores.orders.values()].filter(
          (o: any) =>
            (!where.userId || o.userId === where.userId) &&
            (!where.channel || o.channel === where.channel) &&
            (!where.status || o.status === where.status) &&
            (!where.externalCheckoutId || o.externalCheckoutId === where.externalCheckoutId),
        )
        if (orderBy?.createdAt === 'desc') list.sort((a: any, b: any) => b.createdAt - a.createdAt)
        return list[0] || null
      }),
      findUnique: vi.fn(async ({ where }: any) => stores.orders.get(where.orderId) || null),
      findMany: vi.fn(async ({ where, orderBy, take, skip }: any) => {
        let list = [...stores.orders.values()].filter((o: any) => matchOrder(o, where))
        if (orderBy?.createdAt === 'desc') list.sort((a: any, b: any) => b.createdAt - a.createdAt)
        if (skip) list = list.slice(skip)
        if (take) list = list.slice(0, take)
        return list
      }),
      count: vi.fn(async ({ where }: any) => {
        return [...stores.orders.values()].filter((o: any) => matchOrder(o, where)).length
      }),
      // 后台订单 Tab 的统计用：按 channel × status 分组拿到条数与金额
      groupBy: vi.fn(async ({ by, where }: any) => {
        const keys: string[] = by || []
        const map = new Map<string, any>()
        for (const o of [...stores.orders.values()].filter((x: any) => matchOrder(x, where))) {
          const k = keys.map((f) => String(o[f])).join('\u0001')
          let g = map.get(k)
          if (!g) {
            g = { _count: { _all: 0 }, _sum: { amount: 0 } }
            for (const f of keys) g[f] = o[f]
            map.set(k, g)
          }
          g._count._all += 1
          g._sum.amount += o.amount ?? 0
        }
        return [...map.values()]
      }),
      create: vi.fn(async ({ data }: any) => {
        const rec = { id: data.orderId || `po_${Date.now()}`, createdAt: Date.now(), updatedAt: Date.now(), ...data }
        stores.orders.set(rec.orderId, rec)
        return rec
      }),
      upsert: vi.fn(async ({ where, create }: any) => {
        const existing = stores.orders.get(where.orderId)
        if (existing) return existing
        const rec = { id: where.orderId, createdAt: Date.now(), updatedAt: Date.now(), ...create }
        stores.orders.set(where.orderId, rec)
        return rec
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const rec = stores.orders.get(where.orderId) || stores.orders.get(where.id)
        if (!rec) throw new Error('Order not found')
        Object.assign(rec, data)
        return rec
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        for (const o of stores.orders.values()) {
          // 兼容两种传参：webhook/alipay 用 { orderId, status }，creem GET 用 { id, status }
          const matchById = where.id ? o.id === where.id : true
          const matchByOrderId = where.orderId ? o.orderId === where.orderId : true
          const idOk = where.id ? matchById : matchByOrderId
          if (idOk && (!where.status || o.status === where.status)) {
            Object.assign(o, data)
            count++
          }
        }
        return { count }
      }),
      delete: vi.fn(async ({ where }: any) => {
        const key = where.orderId || where.id
        const rec = stores.orders.get(key)
        if (!rec) throw new Error('Order not found')
        stores.orders.delete(key)
        return rec
      }),
    },
    webhookLog: {
      findMany: vi.fn(async ({ where, orderBy, take, skip }: any) => {
        let list = [...stores.logs.values()].filter((l: any) => matchLog(l, where))
        if (orderBy?.createdAt === 'desc') list.sort((a: any, b: any) => b.createdAt - a.createdAt)
        if (skip) list = list.slice(skip)
        if (take) list = list.slice(0, take)
        return list
      }),
      findFirst: vi.fn(async ({ where, orderBy }: any) => {
        // 原路子：按 eventId 精确查（去重判断用）
        if (where?.eventId) {
          for (const l of stores.logs.values()) {
            if (l.eventId === where.eventId && (!where.status || l.status === where.status)) return l
          }
          return null
        }
        // 新增路子：按 source / status 取最新一条（后台「取消审计」取 lastFailedAt 用）
        const list = [...stores.logs.values()].filter((l: any) => matchLog(l, where))
        if (orderBy?.createdAt === 'desc') list.sort((a: any, b: any) => b.createdAt - a.createdAt)
        return list[0] ?? null
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = `wl_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const rec = { id, createdAt: new Date(), ...data }
        stores.logs.set(id, rec)
        return rec
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        for (const l of [...stores.logs.values()]) {
          const eventIdOk = where.eventId ? l.eventId === where.eventId : true
          const statusOk = where.status ? l.status === where.status : true
          if (eventIdOk && statusOk) {
            Object.assign(l, data)
            count++
          }
        }
        return { count }
      }),
      count: vi.fn(async ({ where }: any) => {
        return [...stores.logs.values()].filter((l: any) => matchLog(l, where)).length
      }),
    },
    recipe: {
      count: vi.fn(async ({ where }: any) => {
        let n = 0
        for (const r of stores.recipes.values()) {
          if (where?.userId && r.userId !== where.userId) continue
          if (where?.starred !== undefined && r.starred !== where.starred) continue
          n++
        }
        return n
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        for (const r of stores.recipes.values()) {
          if (where.userId && r.userId === where.userId) {
            if (where.title?.equals && r.title.toLowerCase() === String(where.title.equals).toLowerCase()) return r
            if (typeof where.title === 'string' && r.title === where.title) return r
          }
        }
        return null
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return [...stores.recipes.values()].filter((r: any) => (!where?.userId || r.userId === where.userId))
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = `r_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const rec = { id, ...data }
        stores.recipes.set(id, rec)
        return rec
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const r = [...stores.recipes.values()].find((x: any) => x.id === where.id)
        if (r) Object.assign(r, data)
        return r
      }),
    },
    mealPlan: {
      count: vi.fn(async ({ where }: any) => {
        let n = 0
        for (const m of stores.mealPlans.values()) {
          if (where?.userId && m.userId !== where.userId) continue
          n++
        }
        return n
      }),
      findMany: vi.fn(async ({ where }: any) => {
        return [...stores.mealPlans.values()].filter((m: any) => (!where?.userId || m.userId === where.userId))
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        for (const m of stores.mealPlans.values()) {
          if ((!where.userId || m.userId === where.userId) && (!where.weekStart || m.weekStart === where.weekStart)) return m
        }
        return null
      }),
      findUnique: vi.fn(async ({ where }: any) => stores.mealPlans.get(where.id) || null),
      create: vi.fn(async ({ data }: any) => {
        const id = `mp_${Date.now()}_${Math.random().toString(36).slice(2)}`
        // 对齐真实 Prisma：入参 slots.create 会被展开成返回记录里的 slots 数组，
        // 不能再把 `...data` 放在后面覆盖掉它（否则调用方拿到的始终不是数组）。
        const { slots: slotsInput, ...rest } = data
        const slots = (slotsInput?.create || []).map((s: any) => ({
          id: `ms_${Math.random().toString(36).slice(2)}`,
          mealPlanId: id,
          ...s,
        }))
        const rec = { id, ...rest, slots }
        stores.mealPlans.set(id, rec)
        stores.mealSlots.push(...slots)
        return rec
      }),
    },
    mealSlot: {
      findMany: vi.fn(async ({ where }: any) => {
        let list = stores.mealSlots
        if (where?.mealPlanId?.in) {
          list = list.filter((s: any) => where.mealPlanId.in.includes(s.mealPlanId))
        }
        // 对齐真实 Prisma 语义：支持 recipeId: { not: null } / recipeId: null。
        // 不加这段的话，后端过滤空槽的逻辑在测试里等于没跑。
        if (where?.recipeId && typeof where.recipeId === 'object' && 'not' in where.recipeId) {
          list = where.recipeId.not === null
            ? list.filter((s: any) => s.recipeId != null)
            : list.filter((s: any) => s.recipeId !== where.recipeId.not)
        } else if (where && 'recipeId' in where && where.recipeId === null) {
          list = list.filter((s: any) => s.recipeId == null)
        }
        return list
      }),
      deleteMany: vi.fn(async () => {
        const before = stores.mealSlots.length
        stores.mealSlots.length = 0
        return { count: before }
      }),
      createMany: vi.fn(async ({ data }: any) => {
        const created = (data || []).map((s: any) => ({ id: `ms_${Math.random().toString(36).slice(2)}`, ...s }))
        stores.mealSlots.push(...created)
        return { count: created.length }
      }),
    },
    pantryItem: {
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
    },
    usageDaily: {
      findUnique: vi.fn(async ({ where }: any) => {
        const key = usageKey(where.userId_date.userId, where.userId_date.date)
        return stores.usage.get(key) || null
      }),
      upsert: vi.fn(async ({ where, update, create }: any) => {
        const key = usageKey(where.userId_date.userId, where.userId_date.date)
        const existing = stores.usage.get(key)
        if (existing) {
          if (update.recipeCount?.increment) existing.recipeCount += update.recipeCount.increment
          stores.usage.set(key, existing)
          return existing
        }
        const rec = { ...create, recipeCount: create.recipeCount ?? 0 }
        stores.usage.set(key, rec)
        return rec
      }),
    },
    $transaction: vi.fn(async (fn: any) => {
      return fn({
        user: {
          findUnique: prismaMock.user.findUnique,
          update: prismaMock.user.update,
        },
      })
    }),
    pantryItem: {
      count: vi.fn(async ({ where }: any) => {
        return [...stores.pantries.values()].filter((p: any) => (!where?.userId || p.userId === where.userId)).length
      }),
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async ({ where }: any) => {
        for (const p of stores.pantries.values()) {
          if (where.userId && p.userId !== where.userId) continue
          if (where.name && p.name !== where.name) continue
          if (where.id) {
            if (typeof where.id === 'object' && 'not' in where.id) {
              if (p.id === where.id.not) continue
            } else if (p.id !== where.id) continue
          }
          return p
        }
        return null
      }),
      update: vi.fn(async ({ where, data }: any) => {
        for (const p of stores.pantries.values()) {
          if (p.id === where.id && (!where.userId || p.userId === where.userId)) {
            Object.assign(p, data)
            return p
          }
        }
        throw new Error('PantryItem not found: ' + where.id)
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0
        for (const p of stores.pantries.values()) {
          if (p.id === where.id && (!where.userId || p.userId === where.userId)) {
            // 对齐真实 Prisma：data 里 undefined 的字段不参与更新
            const payload: any = {}
            for (const [k, v] of Object.entries(data)) if (v !== undefined) payload[k] = v
            Object.assign(p, { ...payload, updatedAt: new Date(Date.now() + 1) })
            count++
          }
        }
        return { count }
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        let count = 0
        for (const [k, p] of [...stores.pantries.entries()]) {
          if ((!where?.userId || p.userId === where.userId) && (!where?.name || p.name === where.name)) {
            stores.pantries.delete(k)
            count++
          }
        }
        return { count }
      }),
      upsert: vi.fn(async ({ where, create }: any) => {
        const { userId, name } = where.userId_name
        for (const p of stores.pantries.values()) {
          if (p.userId === userId && p.name === name) {
            // 对齐真实 Prisma：update 会刷新 updatedAt（purchase 路由用它区分新增/已存在）
            p.updatedAt = new Date(Date.now() + 1)
            return p
          }
        }
        const now = new Date()
        const rec = { id: `pi_${Date.now()}_${Math.random().toString(36).slice(2)}`, createdAt: now, updatedAt: now, ...create }
        stores.pantries.set(rec.id, rec)
        return rec
      }),
    },
    account: {
      findMany: vi.fn(async ({ where }: any) => stores.accounts.filter((a: any) => (!where?.userId || a.userId === where.userId))),
      delete: vi.fn(async ({ where }: any) => {
        const i = stores.accounts.findIndex((a: any) => a.id === where.id)
        if (i < 0) throw new Error('Account not found: ' + where.id)
        return stores.accounts.splice(i, 1)[0]
      }),
    },
    groceryItem: {
      findMany: vi.fn(async () => []),
    },
  }
}


export const prismaMock = makePrisma()

function clearMockHistory(obj: any) {
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') clearMockHistory(v)
    else if (typeof v === 'function' && 'mockClear' in v) v.mockClear()
  }
}

/** 每个测试前调用：清空内存状态 + 清空 mock 调用记录（保留实现） */
export function resetPrisma() {
  resetStores()
  clearMockHistory(prismaMock)
}
