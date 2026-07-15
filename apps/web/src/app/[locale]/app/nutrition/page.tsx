import { getTranslations } from 'next-intl/server'

// TODO: Phase 2 - 营养追踪功能
// 功能：每日热量+蛋白质统计
// 状态：后期实现
// 计划：
//   - 前端页面：app/app/nutrition/page.tsx
//   - API: /api/nutrition/daily (获取当日营养数据)
//   - API: /api/nutrition/log (记录营养数据)
//   - API: /api/nutrition/stats (周/月统计图表数据)
//   - 数据库：nutrition_logs 表 (user_id, date, calories, protein, fat, carbs)

export const metadata = {
  title: "Nutrition - CookMate",
  description: "Track daily nutrition intake, calories and protein",
}

export default async function NutritionPage() {
  const t = await getTranslations('nutrition')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="text-6xl mb-4">🥗</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-gray-500 mb-6">{t('placeholder_desc')}</p>
      <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        {t('placeholder_badge')}
      </div>
    </div>
  )
}