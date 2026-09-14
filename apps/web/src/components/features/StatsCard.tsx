"use client"

interface StatsCardProps {
  label: string
  value: string | number
  subtext: string
}

export function StatsCard({ label, value, subtext }: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-center hover:shadow-md transition-shadow">
      <div className="text-3xl font-bold text-text-primary tabular-nums">{value}</div>
      <div className="text-sm font-medium text-text-secondary mt-1">{label}</div>
      <div className="text-xs text-text-secondary mt-0.5">{subtext}</div>
    </div>
  )
}