// /api/pantry GET：体验用户必须带 isDemoUser 标记
// 回归背景：食材库页此前并行发两个请求（/api/pantry 与 /api/user/profile），
// 谁后返回谁覆盖状态；而本接口对体验用户返回空数组，
// 一旦它后返回就把示例食材清空 —— 体验版食材库空白。
import { describe, it, expect, beforeEach, vi } from "vitest"
import { prismaMock, resetPrisma } from "./_helpers/mock-prisma"

vi.mock("@/lib/prisma", async () => {
  const { prismaMock } = await import("./_helpers/mock-prisma")
  return { prisma: prismaMock }
})
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@cookmate/shared/utils/locale", () => ({
  getLocaleFromCookie: () => "zh-CN",
  err: (_l: string, k: string) => k,
}))

import { auth } from "@/lib/auth"
import { GET } from "@/app/api/pantry/route"

function getReq() {
  return new Request("http://localhost/api/pantry", { method: "GET" })
}

beforeEach(() => resetPrisma())

describe("pantry GET — 体验模式", () => {
  it("体验用户 → isDemoUser=true，items 为空数组（由前端渲染示例食材）", async () => {
    ;(auth as any).mockResolvedValue({ user: { id: "demo-user-id", email: "demo@cookmate.local" } })
    const res = await GET(getReq())
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.isDemoUser).toBe(true)
    expect(json.items).toEqual([])
  })

  it("普通用户 → isDemoUser=false", async () => {
    ;(auth as any).mockResolvedValue({ user: { id: "u1", email: "u1@x.com" } })
    const res = await GET(getReq())
    const json = await res.json()
    expect(json.isDemoUser).toBe(false)
  })

  it("未登录 → 401", async () => {
    ;(auth as any).mockResolvedValue(null)
    const res = await GET(getReq())
    expect(res.status).toBe(401)
  })
})
