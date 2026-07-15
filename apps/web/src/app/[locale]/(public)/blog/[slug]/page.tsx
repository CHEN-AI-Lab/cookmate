import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { notFound } from "next/navigation"

const POST_SLUGS = [
  "weekly-meal-planning-guide",
  "ai-cooking-tips",
  "meal-prep-beginners",
  "grocery-budget-tips",
  "what-is-cookmate",
] as const

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = await getTranslations("blog")

  if (!POST_SLUGS.includes(slug as typeof POST_SLUGS[number])) {
    notFound()
  }

  const postIndex = POST_SLUGS.indexOf(slug as typeof POST_SLUGS[number]) + 1
  const title = t(`post${postIndex}Title`)
  const excerpt = t(`post${postIndex}Excerpt`)
  const tags = t.raw(`post${postIndex}Tags`) as string[]
  const readTime = t(`post${postIndex}ReadTime`)

  const dates: Record<string, string> = {
    "weekly-meal-planning-guide": "2026-05-20",
    "ai-cooking-tips": "2026-05-15",
    "meal-prep-beginners": "2026-05-10",
    "grocery-budget-tips": "2026-05-05",
    "what-is-cookmate": "2026-04-28",
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <article className="max-w-3xl mx-auto px-8 pt-20 pb-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#FF6B35] transition-colors mb-8"
        >
          ← Back to Blog
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
            <span>{dates[slug]}</span>
            <span>·</span>
            <span>⏱ {readTime}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#2D3436] leading-tight">
            {title}
          </h1>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-orange-50 text-[#FF6B35] rounded-full px-3 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 prose prose-orange max-w-none">
            <p className="text-gray-600 leading-relaxed text-lg">{excerpt}</p>
            <p className="text-gray-400 mt-8 italic text-center">
              📝 Full article content coming soon
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}