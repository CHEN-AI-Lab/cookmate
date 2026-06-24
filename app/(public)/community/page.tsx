// TODO: Phase 3 - 社区菜谱分享页面
// 功能：用户分享和浏览社区菜谱
// 状态：后期实现
// 计划：
//   - 前端页面：app/(public)/community/page.tsx
//   - API: /api/community/recipes (获取社区菜谱列表)
//   - API: /api/community/recipes/[id] (获取单个菜谱详情)
//   - API: /api/community/recipes (发布菜谱)
//   - 数据库：community_recipes 表

export const metadata = {
  title: "社区菜谱 - CookMate",
  description: "分享和发现社区菜谱",
}

export default function CommunityPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="text-6xl mb-4">👨‍🍳</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">社区菜谱</h1>
      <p className="text-gray-500 mb-6">
        分享你的独家菜谱，发现其他用户的创意料理
      </p>
      <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        ⏸️ 此功能规划中，后期实现
      </div>
    </div>
  )
}
