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
  title: "营养追踪 - CookMate",
  description: "记录每日营养摄入，追踪热量与蛋白质",
}

export default function NutritionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="text-6xl mb-4">🥗</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">营养追踪</h1>
      <p className="text-gray-500 mb-6">
        记录每日热量、蛋白质等营养数据，生成周/月统计图表
      </p>
      <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        ⏸️ 此功能规划中，后期实现
      </div>
    </div>
  )
}
