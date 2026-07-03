"use client"

interface AddToPlanDialogProps {
  recipeTitle: string
  onConfirm: (day: string, meal: string) => void
  onCancel: () => void
}

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
const MEALS = ["早餐", "午餐", "晚餐"]

export function AddToPlanDialog({
  recipeTitle,
  onConfirm,
  onCancel,
}: AddToPlanDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-[#2D3436] mb-4">📅 加入周计划</h3>
        <p className="text-sm text-gray-500 mb-4">&ldquo;{recipeTitle}&rdquo; 加入</p>
        <div className="flex gap-2 mb-3">
          <select
            id="plan-day"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            defaultValue="周一"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            id="plan-meal"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            defaultValue="午餐"
          >
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm"
          >
            取消
          </button>
          <button
            onClick={() => {
              const day = (document.getElementById("plan-day") as HTMLSelectElement).value
              const meal = (document.getElementById("plan-meal") as HTMLSelectElement).value
              onConfirm(day, meal)
            }}
            className="flex-1 bg-[#FF6B35] text-white py-2 rounded-xl text-sm"
          >
            确认加入
          </button>
        </div>
      </div>
    </div>
  )
}