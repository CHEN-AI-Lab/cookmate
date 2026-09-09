// 管理员鉴权 helper：所有 /api/admin/* 路由 + 管理后台入口共用
// 规则：登录用户的邮箱匹配环境变量 ADMIN_EMAILS（逗号分隔多邮箱）时放行；
// 向后兼容旧的单邮箱 ADMIN_EMAIL 变量；都未配置时一律拒绝（fail-closed）
import { auth } from "@/lib/auth"

export type AdminGate =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string }

// 纯函数：邮箱是否命中管理员白名单（多邮箱逗号分隔、大小写不敏感）
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const userEmail = email.toLowerCase()

  // 支持多邮箱白名单（逗号分隔），向后兼容旧的单一 ADMIN_EMAIL
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return adminEmails.length > 0 && adminEmails.includes(userEmail)
}

export async function requireAdmin(): Promise<AdminGate> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "未登录" }
  }

  if (!isAdminEmail(session.user.email)) {
    return { ok: false, status: 403, error: "无权限访问" }
  }

  return { ok: true }
}
