import { ArrowDownWideNarrow, ListChecks } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { SortKey, StatusFilter } from '@/types/task'

export type { StatusFilter }

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '已完成' },
]

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'dueAt', label: '截止时间' },
  { value: 'priority', label: '优先级' },
  { value: 'createdAt', label: '创建时间' },
  { value: 'manual', label: '手动排序' },
]

interface TaskToolbarProps {
  status: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  sortKey: SortKey
  onSortChange: (key: SortKey) => void
  count: number
  batchMode: boolean
  onToggleBatch: () => void
}

/** 列表上方的筛选 / 排序 / 批量管理条 */
export function TaskToolbar({
  status,
  onStatusChange,
  sortKey,
  onSortChange,
  count,
  batchMode,
  onToggleBatch,
}: TaskToolbarProps) {
  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortKey)?.label ?? '截止时间'

  return (
    <div className="mt-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-0.5 rounded-[10px] bg-segment/80 p-[3px]">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusChange(option.value)}
            className={cn(
              'h-[24px] rounded-[7px] px-2.5 text-[11.5px] transition-all duration-200',
              status === option.value
                ? 'bg-card text-ink shadow-raised'
                : 'text-ink-soft hover:text-ink',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="num text-[10.5px] text-ink-faint">{count} 项</span>

        <button
          type="button"
          onClick={onToggleBatch}
          aria-pressed={batchMode}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] transition-colors',
            batchMode
              ? 'border-brand-line bg-brand-soft text-brand-strong'
              : 'border-transparent text-ink-soft hover:bg-card hover:text-ink',
          )}
        >
          <ListChecks className="size-3.5" />
          批量管理
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="xs"
              className="gap-1.5 text-ink-soft hover:bg-card hover:text-ink"
            >
              <ArrowDownWideNarrow className="size-3.5" />
              <span className="text-[11.5px]">{sortLabel}</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-[10.5px] tracking-wider text-ink-faint uppercase">
              排序方式
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sortKey}
              onValueChange={(value) => onSortChange(value as SortKey)}
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}