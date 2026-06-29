"use client"

interface StatsCardProps {
  label: string
  value: string | number
  subtext: string
}

export function StatsCard({ label, value, subtext }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
      <div className="text-3xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-sm font-medium text-gray-500 mt-1">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{subtext}</div>
    </div>
  )
}