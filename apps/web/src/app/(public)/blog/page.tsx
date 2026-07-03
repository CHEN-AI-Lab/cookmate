import { auth } from "@/lib/auth"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { BlogCard } from "@/components/features/BlogCard"

const POSTS = [
  {
    slug: "weekly-meal-planning-guide",
    title: "一周食谱规划指南：告别每天想「吃什么」",
    excerpt: "手把手教你用 CookMate 做一周食谱规划，省时省钱又健康。",
    date: "2026-05-20",
    tags: ["周计划", "效率"],
    readTime: "5 分钟",
  },
  {
    slug: "ai-cooking-tips",
    title: "AI 辅助烹饪：如何让 AI 做出你喜欢的菜",
    excerpt: "学会用对 prompt，让 CookMate 的 AI 推荐更懂你的口味偏好。",
    date: "2026-05-15",
    tags: ["AI", "技巧"],
    readTime: "4 分钟",
  },
  {
    slug: "meal-prep-beginners",
    title: "备餐入门指南：周末 2 小时解决一周吃饭问题",
    excerpt: "周末备餐（Meal Prep）的正确打开方式，搭配 CookMate 效率翻倍。",
    date: "2026-05-10",
    tags: ["备餐", "生活技巧"],
    readTime: "6 分钟",
  },
  {
    slug: "grocery-budget-tips",
    title: "买菜省钱攻略：月省 500 的食材采购法",
    excerpt: "用好购物清单和食材库，减少浪费，每月至少省 500 元买菜钱。",
    date: "2026-05-05",
    tags: ["省钱", "购物清单"],
    readTime: "5 分钟",
  },
  {
    slug: "what-is-cookmate",
    title: "CookMate 是什么？—— AI 食谱助手的完整介绍",
    excerpt: "一文读懂 CookMate 的核心理念、功能和使用方法。",
    date: "2026-04-28",
    tags: ["介绍"],
    readTime: "3 分钟",
  },
]

export default async function BlogPage() {
  const session = await auth()
  const ctaHref = session ? "/app/dashboard" : "/register"

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">
          📝 CookMate 博客
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          食谱灵感、备餐技巧和美食生活方式
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-8 pb-20">
        <div className="space-y-6">
          {POSTS.map((post) => (
            <BlogCard
              key={post.slug}
              title={post.title}
              description={post.excerpt}
              date={post.date}
              readTime={post.readTime}
              tags={post.tags}
              slug={post.slug}
            />
          ))}
        </div>

        {POSTS.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl">📝</span>
            <p className="mt-4 text-gray-400">暂无文章，敬请期待</p>
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  )
}