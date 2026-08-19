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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索食材..."
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accent"
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
        <div className="mb-3 bg-error/10 border border-error/25 text-error text-sm rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      {/* My ingredients */}
      <div className="mb-2">
        <h2 className="font-bold text-text-primary mb-3">
          📦 我的食材 ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl">🥬</span>
            <p className="mt-4 text-text-secondary font-medium">添加食材到你的仓库</p>
            <p className="text-sm text-text-secondary mt-1">
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
                    : "bg-surface text-accent border-orange-200 hover:bg-surface"
                }`}
              >
                {item.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteItem(item.id)
                  }}
                  className="ml-1 hover:text-error"
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
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="px-5 pb-5 pt-3 space-y-4">
          {QUICK_ADD.map((group) => (
            <div key={group.category}>
              <p className="text-xs font-semibold text-text-secondary uppercase mb-2">
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
                          : "bg-surface text-text-secondary border-border hover:border-accent"
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
          <div className="bg-card border border-border shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-amber-500 text-base shrink-0">⚠️</span>
            <span className="text-text-primary">「{dupDialog}」已在食材库中</span>
          </div>
        </div>
      )}
    </div>
  )
}