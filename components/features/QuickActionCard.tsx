"use client"

interface QuickActionCardProps {
  href: string
  title: string
  desc: string
  emoji: string
  hoverBorder: string
  hoverShadow: string
}

export function QuickActionCard({
  href,
  title,
  desc,
  emoji,
  hoverBorder,
  hoverShadow,
}: QuickActionCardProps) {
  return (
    <a
      href={href}
      className={`group bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${hoverBorder} ${hoverShadow} hover:shadow-md transition-all duration-200 text-center`}
    >
      <span className="text-3xl block mb-3">{emoji}</span>
      <h4 className="font-semibold text-gray-900 group-hover:text-[#FF6B35] transition-colors">
        {title}
      </h4>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </a>
  )
}