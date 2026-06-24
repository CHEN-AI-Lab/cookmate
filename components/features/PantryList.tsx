"use client"

interface PantryItem {
  id: string
  name: string
  category: string | null
}

interface PantryListProps {
  items: PantryItem[]
  onToggleSelect: (id: string) => void
  selectedIds: Set<string>
  search: string
  onSearchChange: (v: string) => void
  QUICK_ADD: Array<{ category: string; items: string[] }>
  onQuickAdd: (name: string) => void
  onAddManual: (name: string) => void
  onDeleteSelected: () => void
  onDeleteItem: (id: string) => void
  error: string | null
  dupDialog?: string | null
}

export function PantryList({
  items,
  onToggleSelect,
  selectedIds,
  search,
  onSearchChange,
  QUICK_ADD,
  onQuickAdd,
  onAddManual,
  onDeleteSelected,
  onDeleteItem,
  error,
  dupDialog,
}: PantryListProps) {
  const filtered = items.filter(
    (i) => !search || i.name.includes(search)
  )

  return (
    <div>
      {/* Search input */}
      <div className="mb-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索食材..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <button
            onClick={() => onAddManual("")}
            className="shrink-0 bg-gradient-to-r from-orange-400 to-amber-400 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1"
          >
            ＋ 添加
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {/* My ingredients */}
      <div className="mb-2">
        <h2 className="font-bold text-[#2D3436] mb-3">
          📦 我的食材 ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl">🥬</span>
            <p className="mt-4 text-gray-500 font-medium">添加食材到你的仓库</p>
            <p className="text-sm text-gray-400 mt-1">
              点击上方快速添加或手动输入食材
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((item) => (
              <span
                key={item.id}
                onClick={() => onToggleSelect(item.id)}
                className={`px-3 py-1 rounded-full text-sm border flex items-center gap-1 cursor-pointer transition-colors ${
                  selectedIds.has(item.id)
                    ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent"
                    : "bg-orange-50 text-[#FF6B35] border-orange-200 hover:bg-orange-100"
                }`}
              >
                {item.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteItem(item.id)
                  }}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selected action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-orange-400 to-amber-400 text-white px-4 py-2.5 rounded-xl">
          <span className="text-sm font-medium">
            🍳 已选 {selectedIds.size} 种
          </span>
          <button
            onClick={onDeleteSelected}
            className="text-sm opacity-80 hover:opacity-100"
          >
            删除选中
          </button>
        </div>
      )}

      {/* Quick add grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 overflow-hidden">
        <div className="px-5 pb-5 pt-3 space-y-4">
          {QUICK_ADD.map((group) => (
            <div key={group.category}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const alreadyAdded = items.some(
                    (i) => i.name.toLowerCase() === item.toLowerCase()
                  )
                  return (
                    <button
                      key={item}
                      onClick={() => onQuickAdd(item)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        alreadyAdded
                          ? "bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#FF6B35]"
                      }`}
                    >
                      {alreadyAdded ? `✓ ${item}` : item}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Duplicate dialog */}
      {dupDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-amber-500 text-base shrink-0">⚠️</span>
            <span className="text-gray-700">「{dupDialog}」已在食材库中</span>
          </div>
        </div>
      )}
    </div>
  )
}