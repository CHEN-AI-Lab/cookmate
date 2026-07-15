import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import PublicNavbar from "@/components/layout/PublicNavbar"
import PublicFooter from "@/components/layout/PublicFooter"
import { BlogCard } from "@/components/features/BlogCard"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "博客 — CookMate",
  description: "餐食规划技巧、AI 美食推荐，让下厨更简单。",
}

export default async function BlogPage() {
  const session = await auth()
  const t = await getTranslations('blog')
  const ctaHref = session ? "/app/dashboard" : "/register"

  const POSTS = [
    {
      slug: "weekly-meal-planning-guide",
      title: t('post1Title'),
      excerpt: t('post1Excerpt'),
      date: "2026-05-20",
      tags: t.raw('post1Tags') as string[],
      readTime: t('post1ReadTime'),
    },
    {
      slug: "ai-cooking-tips",
      title: t('post2Title'),
      excerpt: t('post2Excerpt'),
      date: "2026-05-15",
      tags: t.raw('post2Tags') as string[],
      readTime: t('post2ReadTime'),
    },
    {
      slug: "meal-prep-beginners",
      title: t('post3Title'),
      excerpt: t('post3Excerpt'),
      date: "2026-05-10",
      tags: t.raw('post3Tags') as string[],
      readTime: t('post3ReadTime'),
    },
    {
      slug: "grocery-budget-tips",
      title: t('post4Title'),
      excerpt: t('post4Excerpt'),
      date: "2026-05-05",
      tags: t.raw('post4Tags') as string[],
      readTime: t('post4ReadTime'),
    },
    {
      slug: "what-is-cookmate",
      title: t('post5Title'),
      excerpt: t('post5Excerpt'),
      date: "2026-04-28",
      tags: t.raw('post5Tags') as string[],
      readTime: t('post5ReadTime'),
    },
  ]

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <PublicNavbar ctaHref={ctaHref} session={!!session} />

      <section className="max-w-[1400px] mx-auto px-8 pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-[#2D3436]">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          {t('subtitle')}
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
            <p className="mt-4 text-gray-400">{t('noPosts')}</p>
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  )
}