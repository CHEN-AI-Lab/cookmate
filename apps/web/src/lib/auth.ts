import NextAuth from "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      subscriptionTier: string
      phone: string
      onboardingCompleted: boolean
      provider?: string
      loginMethod?: string
    } & DefaultSession["user"]
  }

  interface JWT {
    subscriptionTier: string
    phone: string
    onboardingCompleted: boolean
    provider?: string
    loginMethod?: string
  }
}

import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import AlipayProvider from "@/lib/providers/alipay"
import WeChatProvider from "@/lib/providers/wechat"
import { hasDemoCookie, DEMO_SESSION } from "@cookmate/shared/utils/demo-cookie"
import { cookies } from "next/headers"
import { decode } from "next-auth/jwt"
import { checkLoginRateLimit, recordLoginAttempt } from "@cookmate/shared/utils/login-rate-limit"
import { checkOtpRateLimit, recordOtpAttempt } from "@cookmate/shared/utils/otp-rate-limit"

const providers = []

// 手机号验证码登录 — 国内用户首选
providers.push(
  Credentials({
    id: "phone",
    name: "手机号登录",
    credentials: {
      phone: { label: "手机号", type: "text" },
      code: { label: "验证码", type: "text" },
      agreeTerms: { label: "同意条款", type: "text" },
    },
    async authorize(credentials) {
      const phone = credentials?.phone as string
      const code = credentials?.code as string
      const agreeTerms = credentials?.agreeTerms === "true"

      if (!phone || !code) return null

      // 防爆破：同一手机号失败次数过多则锁定
      const rateKey = `otp:${phone}`
      if (!checkOtpRateLimit(rateKey).allowed) return null

      // 查找未使用的验证码
      const record = await prisma.verificationCode.findFirst({
        where: {
          phone,
          code,
          used: false,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: "desc" },
      })

      if (!record) { recordOtpAttempt(rateKey, false); return null }
      recordOtpAttempt(rateKey, true)

      // 标记为已使用
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })

      // 查找或创建用户
      let user = await prisma.user.findUnique({ where: { phone } })
      if (!user) {
        // 新用户注册 → 必须同意条款
        if (!agreeTerms) return null
        user = await prisma.user.create({
          data: { phone, name: `用户${phone.slice(-4)}`, termsAgreedAt: new Date() },
        })
      }

      return { id: user.id, name: user.name, phone: user.phone, emailVerified: new Date() }
    },
  })
)

// 邮箱验证码登录
providers.push(
  Credentials({
    id: "email",
    name: "邮箱登录",
    credentials: {
      email: { label: "邮箱", type: "text" },
      code: { label: "验证码", type: "text" },
      agreeTerms: { label: "同意条款", type: "text" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string
      const code = credentials?.code as string
      const agreeTerms = credentials?.agreeTerms === "true"

      if (!email || !code) return null

      // 防爆破：同一邮箱失败次数过多则锁定
      const rateKey = `otp:${email}`
      if (!checkOtpRateLimit(rateKey).allowed) return null

      // 查找未使用的验证码
      const record = await prisma.verificationCode.findFirst({
        where: {
          email,
          code,
          used: false,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: "desc" },
      })

      if (!record) { recordOtpAttempt(rateKey, false); return null }
      recordOtpAttempt(rateKey, true)

      // 标记为已使用
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })

      // 查找或创建用户
      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        // 新用户注册 → 必须同意条款
        if (!agreeTerms) return null
        user = await prisma.user.create({
          data: { email, name: email.split("@")[0], termsAgreedAt: new Date() },
        })
      }

      return { id: user.id, name: user.name, email: user.email!, emailVerified: new Date() }
    },
  })
)

// 邮箱/手机号+密码登录（设过密码的用户可用）
providers.push(
  Credentials({
    id: "password",
    name: "密码登录",
    credentials: {
      account: { label: "邮箱或手机号", type: "text" },
      password: { label: "密码", type: "password" },
    },
    async authorize(credentials) {
      const account = credentials?.account as string
      const password = credentials?.password as string

      if (!account || !password) return null

      // 支持邮箱或手机号登录
      const isPhone = /^1\d{10}$/.test(account)
      const rateKey = `password:${account.toLowerCase()}`

      // 检查是否被锁定
      const rateCheck = checkLoginRateLimit(rateKey)
      if (!rateCheck.allowed) return null

      const user = isPhone
        ? await prisma.user.findUnique({ where: { phone: account } })
        : await prisma.user.findUnique({ where: { email: account } })

      if (!user?.passwordHash) {
        recordLoginAttempt(rateKey, false)
        return null
      }

      const bcrypt = await import("bcryptjs")
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        recordLoginAttempt(rateKey, false)
        return null
      }

      recordLoginAttempt(rateKey, true)
      return { id: user.id, name: user.name, email: user.email!, loginMethod: isPhone ? "phone" : "email", emailVerified: new Date() }
    },
  })
)

// Google / GitHub — 仅当配置了凭证时才启用
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  )
}

// GitHub — 仅当配置了凭证时才启用
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  )
}

// 支付宝登录 — 仅当配置了凭证时才启用
if (process.env.AUTH_ALIPAY_ID && process.env.AUTH_ALIPAY_PRIVATE_KEY) {
  providers.push(
    AlipayProvider({
      clientId: process.env.AUTH_ALIPAY_ID,
      clientSecret: process.env.AUTH_ALIPAY_PRIVATE_KEY,
    })
  )
}

// 微信登录 — 仅当配置了凭证时才启用
if (process.env.AUTH_WECHAT_ID && process.env.AUTH_WECHAT_SECRET) {
  providers.push(
    WeChatProvider({
      clientId: process.env.AUTH_WECHAT_ID,
      clientSecret: process.env.AUTH_WECHAT_SECRET,
    })
  )
}

// 支付宝授权登录回调 — 仅被自定义回调路由调用
providers.push(
  Credentials({
    id: "alipay-auth",
    name: "支付宝",
    credentials: { userId: { label: "User ID", type: "text" } },
    async authorize(credentials) {
      const uid = credentials?.userId as string
      if (!uid) return null
      const user = await prisma.user.findUnique({ where: { id: uid } }).catch(() => null)
      if (!user) return null
      return { id: user.id, name: user.name, email: user.email!, image: user.image, emailVerified: new Date() }
    },
  })
)

// 本地体验登录 — 已迁移到独立 cookie 机制，不经过 NextAuth
// 防止体验用户 session 被用于关联真实 OAuth 账号
// 见 /api/auth/demo-login 和 lib/demo-cookie.ts

// 读取当前登录会话的用户 id（"关联账号"场景判定：已登录用户发起的 OAuth = 关联操作）。
// 直接解码 session cookie，避免在回调里递归调用 auth()；
// 体验用户走独立 demo cookie（无 NextAuth session），解码结果为 null，天然不会进关联分支
async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const cookieName = cookieStore.get("__Secure-authjs.session-token")
      ? "__Secure-authjs.session-token"
      : "authjs.session-token"
    const token = cookieStore.get(cookieName)?.value
    if (!token) return null
    const decoded = await decode({
      token,
      salt: cookieName,
      secret: process.env.AUTH_SECRET!,
    })
    return decoded?.sub ?? null
  } catch {
    return null
  }
}

const { handlers: nextAuthHandlers, auth: nextAuthAuth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.type === "oauth") {
        // ── 关联模式：已登录用户从设置页发起 OAuth = "关联账号"操作 ──
        // signIn() 本质是登录（会把 session 切到 OAuth 身份甚至新建用户），
        // 真正的关联在这里拦截：返回字符串 = 直接重定向且不签发新 session，当前登录态保持不变
        const currentUserId = await getSessionUserId()
        if (currentUserId) {
          // 该 OAuth 账号是否已被绑定
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          })
          if (existingAccount) {
            // 已绑在当前用户身上 → 放行（正常完成登录，session 不变）
            if (existingAccount.userId === currentUserId) return true
            // 绑在别人身上 → 拒绝，不切换登录态
            return "/app/settings?linkError=bound"
          }
          // OAuth 邮箱已被其他账号占用 → 拒绝
          const email = (profile?.email ?? user.email ?? "").trim().toLowerCase()
          if (email) {
            const emailOwner = await prisma.user.findUnique({ where: { email } })
            if (emailOwner && emailOwner.id !== currentUserId) {
              return "/app/settings?linkError=bound"
            }
          }
          // 无冲突 → 把 OAuth 账号绑到当前用户名下（当前登录态保持不变）
          try {
            await prisma.account.create({
              data: {
                userId: currentUserId,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: typeof account.session_state === "string" ? account.session_state : null,
              },
            })
            return `/app/settings?linked=${account.provider}`
          } catch {
            return "/app/settings?linkError=failed"
          }
        }
        // ── 普通登录（无登录态的 OAuth）→ 原逻辑不变 ──
        // OAuth 首次登录时，设置 termsAgreedAt
        if (user.id && user.id !== "demo-user-id") {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { termsAgreedAt: true },
            })
            if (dbUser && !dbUser.termsAgreedAt) {
              await prisma.user.update({
                where: { id: user.id },
                data: { termsAgreedAt: new Date() },
              })
            }
          } catch (e) {
            console.error("signIn callback error:", e)
          }
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.phone = token.phone as string
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
        session.user.provider = token.provider as string
        session.user.loginMethod = token.loginMethod as string
      }
      return session
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.provider = account.provider
      }
      if (user) {
        token.loginMethod = (user as Record<string, unknown>).loginMethod as string | undefined
      }
      if (token.sub) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { subscriptionTier: true, phone: true, onboardingCompleted: true },
          })
          if (user) {
            token.subscriptionTier = user.subscriptionTier
            token.phone = user.phone
            token.onboardingCompleted = user.onboardingCompleted
          }
        } catch {
          token.subscriptionTier = "FREE"
          token.phone = ""
          token.onboardingCompleted = false
        }
      }
      return token
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
    newUser: "/app/dashboard",
  },
})

// 包装 auth() 函数：先检查真实 session，再检查 demo cookie
export async function auth() {
  // 真实 session 优先
  const session = await nextAuthAuth()
  if (session) return session

  // 检查 demo cookie
  const cookieStore = await cookies()
  if (await hasDemoCookie(cookieStore.toString())) {
    return DEMO_SESSION
  }

  return null
}

export { signIn, signOut }
export const handlers = nextAuthHandlers