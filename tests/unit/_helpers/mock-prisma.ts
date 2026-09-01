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
}

export function resetStores() {
  stores.users.clear()
  stores.orders.clear()
  stores.logs.clear()
  stores.recipes.clear()
  stores.mealPlans.clear()
  stores.mealSlots.length = 0
  stores.usage.clear()
}

function usageKey(userId: string, date: any): string {
  const t = date instanceof Date ? date.getTime() : date
  return `${userId}_${t}`
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
        if (where.stripeCustomerId) {
          for (const u of stores.users.values()) if (u.stripeCustomerId === where.stripeCustomerId) return u
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
      findMany: vi.fn(async ({ where, orderBy, take }: any) => {
        let list = [...stores.orders.values()].filter(
          (o: any) =>
            (!where.userId || o.userId === where.userId) &&
            (!where.channel || o.channel === where.channel) &&
            (!where.externalCheckoutId || o.externalCheckoutId === where.externalCheckoutId),
        )
        if (orderBy?.createdAt === 'desc') list.sort((a: any, b: any) => b.createdAt - a.createdAt)
        if (take) list = list.slice(0, take)
        return list
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
      findMany: vi.fn(async ({ where, orderBy, take }: any) => {
        let list = [...stores.logs.values()]
        if (where?.source) list = list.filter((l: any) => l.source === where.source)
        if (orderBy?.createdAt === 'desc') list.sort((a: any, b: any) => b.createdAt - a.createdAt)
        if (take) list = list.slice(0, take)
        return list
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        for (const l of stores.logs.values()) {
          if (where.eventId && l.eventId === where.eventId && (!where.status || l.status === where.status)) return l
        }
        return null
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = `wl_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const rec = { id, ...data }
        stores.logs.set(id, rec)
        return rec
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
        let n = 0
        for (const m of stores.mealPlans.values()) {
          if (where?.userId && m.userId !== where.userId) continue
          n++
        }
        return n
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
