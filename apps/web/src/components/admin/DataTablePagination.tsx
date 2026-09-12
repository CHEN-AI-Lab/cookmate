"use client"

// 后台列表分页控件 —— 样式沿用 my-recipes 的「← 3 / 12 → + 跳页」写法，
// 数据全在服务端，这里只负责翻页与跳页。
//
// 跳页输入框用「非受控 + key 跟着页码变」实现：翻页时 React 重建输入框，天然清空，
// 不需要在 useEffect 里 setState（那会触发级联渲染，lint 也不允许）。

export function DataTablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))

  const go = (p: number) => {
    if (p < 1 || p > pages || p === page) return
    onPageChange(p)
  }

  if (pages <= 1) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-200 px-4 py-3 text-[12px] text-gray-500">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="rounded-xl border border-gray-200 px-3 py-1.5 text-[12px] text-gray-700 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
      >
        ←
      </button>
      <span>
        {page} / {pages}
      </span>
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= pages}
        className="rounded-xl border border-gray-200 px-3 py-1.5 text-[12px] text-gray-700 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
      >
        →
      </button>
      <span className="ml-2">跳至</span>
      <input
        key={page}
        type="number"
        min={1}
        max={pages}
        placeholder={String(page)}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return
          const n = Number.parseInt(e.currentTarget.value, 10)
          if (n >= 1 && n <= pages) go(n)
        }}
        className="w-14 rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-center text-[12px] text-gray-700 outline-none focus:border-accent"
      />
      <span>/ {pages} 页</span>
    </div>
  )
}
