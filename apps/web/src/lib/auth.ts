import NextAuth from "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      subscriptionTier: string
      phone: string
      onboardingCompleted: boolean
    } & DefaultSession["user"]
  }

  interface JWT {
    subscriptionTier: string
    phone: string
    onboardingCompleted: boolean
  }
}

import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const providers = []

// 手机号验证码登录 — 国内用户首选
providers.push(
  Credentials({
    id: "phone",
    name: "手机号登录",
    credentials: {
      phone: { label: "手机号", type: "text" },
      code: { label: "验证码", type: "text" },
    },
    async authorize(credentials) {
      const phone = credentials?.phone as string
      const code = credentials?.code as string

      if (!phone || !code) return null

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

      if (!record) return null

      // 标记为已使用
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })

      // 查找或创建用户
      let user = await prisma.user.findUnique({ where: { phone } })
      if (!user) {
        user = await prisma.user.create({
          data: { phone, name: `用户${phone.slice(-4)}` },
        })
      }

      return { id: user.id, name: user.name, phone: user.phone }
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
    },
    async authorize(credentials) {
      const email = credentials?.email as string
      const code = credentials?.code as string

      if (!email || !code) return null

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

      if (!record) return null

      // 标记为已使用
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })

      // 查找或创建用户
      let user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        user = await prisma.user.create({
          data: { email, name: email.split("@")[0] },
        })
      }

      return { id: user.id, name: user.name, email: user.email! }
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
      const user = isPhone
        ? await prisma.user.findUnique({ where: { phone: account } })
        : await prisma.user.findUnique({ where: { email: account } })

      if (!user?.passwordHash) return null

      const bcrypt = await import("bcryptjs")
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) return null

      return { id: user.id, name: user.name, email: user.email! }
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

// 本地体验登录 — 始终可用，不依赖数据库
providers.push(
  Credentials({
    id: "demo",
    name: "体验登录",
    credentials: {},
    async authorize() {
      return {
        id: "demo-user-id",
        email: "demo@cookmate.local",
        name: "体验用户",
        phone: "",
      }
    },
  })
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.phone = token.phone as string
        session.user.onboardingCompleted = token.onboardingCompleted as boolean
      }
      return session
    },
    async jwt({ token }) {
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
    newUser: "/app/dashboard",
  },
})