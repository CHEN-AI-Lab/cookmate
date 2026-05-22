import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const providers = []

// Google — 仅当配置了凭证时才启用
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

// 本地体验登录 — 始终可用（开发/演示用途）
providers.push(
  Credentials({
    id: "demo",
    name: "体验登录",
    credentials: {},
    async authorize() {
      const demoEmail = "demo@cookmate.local"
      let user = await prisma.user.findUnique({ where: { email: demoEmail } })
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: demoEmail,
            name: "体验用户",
          },
        })
      }
      return { id: user.id, email: user.email!, name: user.name }
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
      }
      return session
    },
    async jwt({ token }) {
      return token
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/app/dashboard",
  },
})