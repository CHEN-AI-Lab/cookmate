// 行为埋点：复用自建统计通道（stats-worker /track），与前端 VisitTracker 同一数据出口
// - 服务端调用：内部吞掉所有错误与超时，绝不影响业务接口
// - NEXT_PUBLIC_WORKER_URL 未配置时静默跳过（本地开发不上报）
// - 只上报事件名与环境，不带任何用户内容
import { WORKER_URL } from "../constants"

export async function trackEvent(tool: string): Promise<void> {
  if (!WORKER_URL) return
  try {
    await fetch(`${WORKER_URL}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: "cookmate",
        tool,
        type: "tool",
        env: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
        platform: "web",
      }),
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // 统计失败静默：不影响业务
  }
}
