"use client"

interface ManualAddSectionProps {
  stapleItems: string[]
  stapleOpen: boolean
  onStapleToggle: () => void
  newItem: string
  onNewItemChange: (v: string) => void
  onAddItem: () => void
  manualItems: string[]
  onRemoveManual: (name: string) => void
  dupDialog: string | null
}

export function ManualAddSection({
  stapleItems,
  stapleOpen,
  onStapleToggle,
  newItem,
  onNewItemChange,
  onAddItem,
  manualItems,
  onRemoveManual,
  dupDialog,
}: ManualAddSectionProps) {
  return (
    <div className="mt-6 space-y-4">
      {/* Manual add input */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => onNewItemChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onAddItem()
              }
            }}
            placeholder="手动添加物品..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF6B35]"
          />
          <button
            onClick={onAddItem}
            className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shrink-0"
          >
            添加
          </button>
        </div>
      </div>

      {/* Staple items collapsible */}
      {stapleItems.length > 0 && (
        <div>
          <button
            onClick={onStapleToggle}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span
              className={`transition-transform ${stapleOpen ? "rotate-90" : ""}`}
            >
              ▶
            </span>
            🏪 常备食材（{stapleItems.length}种）
          </button>
          {stapleOpen && (
            <div className="flex flex-wrap gap-2 mt-2">
              {stapleItems.map((name) => (
                <span
                  key={name}
                  className="px-3 py-1 rounded-full text-xs bg-gray-50 text-gray-500 border border-gray-200"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual added items list */}
      {manualItems.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            📝 手动添加
          </h3>
          <div className="flex flex-wrap gap-2">
            {manualItems.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-orange-50 text-[#FF6B35] border border-orange-200"
              >
                {name}
                <button
                  onClick={() => onRemoveManual(name)}
                  className="text-gray-400 hover:text-red-500 text-xs leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate dialog */}
      {dupDialog && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-[15vh]">
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl px-5 py-3.5 text-sm flex items-center gap-2.5 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <span className="text-amber-500 text-base shrink-0">⚠️</span>
            <span className="text-gray-700">
              「{dupDialog}」已在购物清单中
            </span>
          </div>
        </div>
      )}
    </div>
  )
}