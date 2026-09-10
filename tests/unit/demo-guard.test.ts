// 体验模式守卫单元测试：新写接口默认被拦、真实用户不误伤
import { describe, it, expect } from "vitest"
import {
  DEMO_COOKIE_NAME,
  hasDemoCookieHeader,
  hasSessionCookieHeader,
  isDemoOnlyRequest,
  isDemoWriteAllowed,
  isSafeMethod,
  DEMO_LINKED_ACCOUNTS,
} from "@cookmate/shared/utils/demo-guard"

const DEMO = DEMO_COOKIE_NAME + "=payload.signature"
const SESSION = "authjs.session-token=jwt"

describe("hasDemoCookieHeader", () => {
  it("带体验 cookie → true", () => expect(hasDemoCookieHeader(DEMO)).toBe(true))
  it("混在其他 cookie 中 → true", () =>
    expect(hasDemoCookieHeader("NEXT_LOCALE=zh-CN; " + DEMO + "; other=1")).toBe(true))
  it("没有体验 cookie → false", () => expect(hasDemoCookieHeader("NEXT_LOCALE=zh-CN")).toBe(false))
  it("null → false", () => expect(hasDemoCookieHeader(null)).toBe(false))
  it("相似名不误判 → false", () => expect(hasDemoCookieHeader("cookmate_demo_x=1")).toBe(false))
})

describe("hasSessionCookieHeader", () => {
  it("标准会话 cookie → true", () => expect(hasSessionCookieHeader(SESSION)).toBe(true))
  it("__Secure 前缀 → true", () =>
    expect(hasSessionCookieHeader("__Secure-authjs.session-token=xxx")).toBe(true))
  it("分片会话 cookie → true", () =>
    expect(
      hasSessionCookieHeader("__Secure-authjs.session-token.0=aaa; __Secure-authjs.session-token.1=bbb")
    ).toBe(true))
  it("无会话 cookie → false", () => expect(hasSessionCookieHeader("a=b")).toBe(false))
})

describe("isDemoOnlyRequest", () => {
  it("仅有体验 cookie → true（应被拦截）", () => expect(isDemoOnlyRequest(DEMO)).toBe(true))
  it("体验 cookie + 真实会话 → false（真实用户即使残留体验 cookie 也不误伤）", () =>
    expect(isDemoOnlyRequest(DEMO + "; " + SESSION)).toBe(false))
  it("只有会话 cookie → false", () => expect(isDemoOnlyRequest(SESSION)).toBe(false))
  it("无 cookie → false", () => expect(isDemoOnlyRequest(null)).toBe(false))
})

describe("isSafeMethod", () => {
  it("GET/HEAD/OPTIONS → true", () => {
    expect(isSafeMethod("GET")).toBe(true)
    expect(isSafeMethod("HEAD")).toBe(true)
    expect(isSafeMethod("OPTIONS")).toBe(true)
  })
  it("POST/PUT/DELETE/PATCH → false", () => {
    expect(isSafeMethod("POST")).toBe(false)
    expect(isSafeMethod("PUT")).toBe(false)
    expect(isSafeMethod("DELETE")).toBe(false)
    expect(isSafeMethod("PATCH")).toBe(false)
  })
})

describe("isDemoWriteAllowed", () => {
  it("NextAuth 自身流程放行", () => {
    expect(isDemoWriteAllowed("/api/auth/demo-login")).toBe(true)
    expect(isDemoWriteAllowed("/api/auth/demo-logout")).toBe(true)
    expect(isDemoWriteAllowed("/api/auth/signout")).toBe(true)
  })
  it("业务写接口一律不放行（新增接口自动受限）", () => {
    expect(isDemoWriteAllowed("/api/pantry")).toBe(false)
    expect(isDemoWriteAllowed("/api/recipes/generate")).toBe(false)
    expect(isDemoWriteAllowed("/api/user/profile")).toBe(false)
    expect(isDemoWriteAllowed("/api/user/onboarding")).toBe(false)
    expect(isDemoWriteAllowed("/api/user/unlink-account")).toBe(false)
    expect(isDemoWriteAllowed("/api/creem/create-checkout")).toBe(false)
  })
})

describe("DEMO_LINKED_ACCOUNTS", () => {
  it("返回已绑定的 Google / GitHub，使前端不再渲染关联按钮", () => {
    expect(DEMO_LINKED_ACCOUNTS.map((a) => a.provider)).toEqual(["google", "github"])
  })
})
