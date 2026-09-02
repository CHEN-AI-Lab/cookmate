// 管理员鉴权 helper：所有 /api/admin/* 路由共用
// 规则：仅当登录用户的邮箱匹配环境变量 ADMIN_EMAIL 时放行；未配置 ADMIN_EMAIL 时一律拒绝（安全默认，fail-closed）
import { auth } from "@/lib/auth"

export type AdminGate =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string }

export async function requireAdmin(): Promise<AdminGate> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "未登录" }
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const userEmail = session.user.email?.toLowerCase()
  if (!adminEmail || !userEmail || userEmail !== adminEmail.toLowerCase()) {
    return { ok: false, status: 403, error: "无权限访问" }
  }

  return { ok: true }
}
