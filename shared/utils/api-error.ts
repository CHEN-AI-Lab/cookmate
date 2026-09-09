// ─── 前端 API 错误分类工具 ───
// 背景：以前所有失败都统一提示"网络错误"，掩盖了登录失效、超时、AI 降级、服务端异常等
// 完全不同的原因，用户和开发都无法定位。这里把失败原因结构化，前端按 kind 展示对应文案，
// 并保留 detail 供日志排查。
//
// 注意：本文件只做「分类」，不含任何展示文案（文案统一放 shared/messages/，由页面用 t() 取）。

import { API_TIMEOUT } from "../constants/api-errors"

/** 失败原因分类 */
export type ApiErrorKind =
  | "network" // 网络不可达 / DNS 失败 / 连接被重置
  | "timeout" // 请求超时（前端 AbortController 触发）
  | "unauthorized" // 401 登录失效
  | "rateLimit" // 429 当日额度用完
  | "server" // 5xx 服务端异常
  | "paymentRequired" // 403/402 需要升级套餐
  | "aiBusy" // AI 服务不可用/降级，且没有可用数据返回
  | "emptyData" // 接口成功但返回数据为空或格式异常
  | "unknown" // 兜底

export interface ApiErrorInfo {
  kind: ApiErrorKind
  /** HTTP 状态码；0 表示根本没拿到响应（网络层失败/超时） */
  status: number
  /** 可定位问题的细节（后端 detail / 原始 error message），仅用于日志，不直接展示给用户 */
  detail: string
  /** 是否值得让用户重试 */
  retryable: boolean
}

/** 请求超时专用错误，便于调用方区分"超时"与"网络不可达" */
export class ApiTimeoutError extends Error {
  readonly timeoutMs: number
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`)
    this.name = "ApiTimeoutError"
    this.timeoutMs = timeoutMs
  }
}

/**
 * 带超时的 fetch。超时后抛 ApiTimeoutError。
 * 用法与原生 fetch 一致，额外多一个 timeoutMs 参数。
 */
export async function fetchWithTimeout(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs = API_TIMEOUT.default, ...rest } = init ?? {}
  // 调用方传入了自己的 signal 时，两个信号都要能取消请求
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onExternalAbort = () => controller.abort()
  rest.signal?.addEventListener("abort", onExternalAbort)

  try {
    return await fetch(url, { ...rest, signal: controller.signal })
  } catch (err) {
    // 判定超时的依据是「我们自己的定时器触发了 abort，且调用方没有主动取消」，
    // 而不是 err.name —— 浏览器抛 DOMException(AbortError)、Node 抛 Error(AbortError)，
    // 名字不统一，靠名字判断会在某些运行时漏判。
    if (controller.signal.aborted && !rest.signal?.aborted) {
      throw new ApiTimeoutError(timeoutMs)
    }
    throw err
  } finally {
    clearTimeout(timer)
    rest.signal?.removeEventListener("abort", onExternalAbort)
  }
}

/** 安全解析响应体：非 JSON（如平台 504 返回的 HTML）不会抛异常，返回 null */
export async function parseJsonSafely(res: Response): Promise<Record<string, unknown> | null> {
  try {
    const text = await res.text()
    if (!text) return null
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}

/** 分类 fetch 本身抛出的异常（网络层失败 / 超时） */
export function classifyNetworkError(err: unknown, timeoutMs?: number): ApiErrorInfo {
  if (err instanceof ApiTimeoutError) {
    return { kind: "timeout", status: 0, detail: `timeout after ${err.timeoutMs}ms`, retryable: true }
  }
  // fetch 失败通常是 TypeError: Failed to fetch / NetworkError
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { kind: "network", status: 0, detail: `offline — ${message}`, retryable: true }
  }
  return { kind: "network", status: 0, detail: message, retryable: true }
}

/** 分类 HTTP 响应（拿到了响应但业务上失败） */
export function classifyHttpError(res: Response, data: Record<string, unknown> | null): ApiErrorInfo {
  const detail = typeof data?.detail === "string" ? data.detail : ""
  const serverMsg = typeof data?.error === "string" ? data.error : ""
  const merged = [serverMsg, detail].filter(Boolean).join(" | ") || res.statusText || `HTTP ${res.status}`

  if (res.status === 401) return { kind: "unauthorized", status: 401, detail: merged, retryable: false }
  if (res.status === 402 || res.status === 403) {
    return { kind: "paymentRequired", status: res.status, detail: merged, retryable: false }
  }
  if (res.status === 429) return { kind: "rateLimit", status: 429, detail: merged, retryable: false }
  if (res.status >= 500) return { kind: "server", status: res.status, detail: merged, retryable: true }
  return { kind: "unknown", status: res.status, detail: merged, retryable: true }
}

/** 接口返回 200 但数据为空/格式不对 */
export function emptyDataError(detail: string): ApiErrorInfo {
  return { kind: "emptyData", status: 200, detail, retryable: true }
}

/** AI 降级且没有可用数据 */
export function aiBusyError(detail: string): ApiErrorInfo {
  return { kind: "aiBusy", status: 200, detail, retryable: true }
}

/** i18n key：把 kind 映射到 messages 里的文案键（页面用 t(kindToMessageKey(kind)) 取） */
export function kindToMessageKey(kind: ApiErrorKind): string {
  return `genError_${kind}`
}

/** 拼一行可定位的日志上下文（页面 console.error 时用） */
export function errorLogContext(scope: string, info: ApiErrorInfo): string {
  return `[${scope}] kind=${info.kind} status=${info.status} retryable=${info.retryable} detail=${info.detail}`
}
