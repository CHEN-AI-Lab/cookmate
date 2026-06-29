"use client"

import Link from "next/link"

interface BlogCardProps {
  title: string
  description: string
  date: string
  readTime: string
  tags: string[]
  slug: string
}

export function BlogCard({
  title,
  description,
  date,
  readTime,
  tags,
  slug,
}: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="block bg-white rounded-2xl border border-orange-50 shadow-sm p-6 hover:shadow-md hover:border-orange-200 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <h2 className="font-bold text-lg text-[#2D3436] group-hover:text-[#FF6B35] transition-colors">
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
            <span>{date}</span>
            <span>·</span>
            <span>⏱ {readTime}</span>
            {tags.length > 0 && (
              <>
                <span>·</span>
                <div className="flex gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-orange-50 text-[#FF6B35] rounded-full px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {description}
          </p>
        </div>
        <span className="text-gray-300 group-hover:text-[#FF6B35] transition-colors text-xl shrink-0 mt-1">
          →
        </span>
      </div>
    </Link>
  )
}