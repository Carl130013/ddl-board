import { Check, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface BatchBarProps {
  total: number
  selectedCount: number
  allSelected: boolean
  onToggleAll: () => void
  onExit: () => void
}

/** 批量模式顶部条：全选 / 已选数量 / 退出 */
export function BatchBar({ total, selectedCount, allSelected, onToggleAll, onExit }: BatchBarProps) {
  return (
    <div className="mt-3 flex h-9 items-center gap-2.5 rounded-xl border border-brand-line bg-brand-soft px-3">
      <button
        type="button"
        onClick={onToggleAll}
        className="flex items-center gap-2 text-[11.5px] font-medium text-brand-strong"
      >
        <span
          className={cn(
            'flex size-[15px] items-center justify-center rounded-[4px] border transition-colors',
            allSelected
              ? 'border-transparent bg-brand text-white'
              : 'border-brand-line bg-card text-transparent',
          )}
        >
          <Check className="size-[10px]" strokeWidth={3.5} />
        </span>
        {allSelected ? '取消全选' : '全选'}
      </button>

      <span className="h-3.5 w-px bg-brand-line" aria-hidden />

      <span className="num text-[11px] text-ink-soft">
        已选 {selectedCount} / {total}
      </span>

      <button
        type="button"
        onClick={onExit}
        className="ml-auto text-[11px] text-ink-soft transition-colors hover:text-ink"
      >
        退出批量管理
      </button>
    </div>
  )
}

interface BatchFloatingBarProps {
  count: number
  onDelete: () => void
  onClear: () => void
}

/** 底部悬浮操作条：选中任务后出现 */
export function BatchFloatingBar({ count, onDelete, onClear }: BatchFloatingBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-40 flex justify-center">
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 18, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto flex h-11 items-center gap-3 rounded-full border border-hairline bg-card pr-1.5 pl-4 shadow-float"
      >
        <span className="num text-[11.5px] text-ink-soft">已选 {count} 项</span>

        <button
          type="button"
          onClick={onClear}
          className="text-[11.5px] text-ink-faint transition-colors hover:text-ink"
        >
          取消
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="flex h-8 items-center gap-1.5 rounded-full bg-danger px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-danger-hover"
        >
          <Trash2 className="size-3.5" />
          删除选中任务 ({count})
        </button>
      </motion.div>
    </div>
  )
}