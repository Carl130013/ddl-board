import { useMemo } from 'react'
import { Layers } from 'lucide-react'

import { buildDateRange, formatNumericMonthDay, toDateKey, WEEKDAY_LABELS } from '@/lib/date'
import { CATEGORY_META } from '@/lib/meta'
import { cn } from '@/lib/utils'
import type { TaskWithDerived } from '@/types/task'

interface DateRailProps {
  tasks: TaskWithDerived[]
  /** 'all' 或 'YYYY-MM-DD' */
  selectedDate: string
  onSelect: (dateKey: string) => void
}

const RAIL_DAYS = 14

/**
 * 左侧时间轴：未来 14 天的垂直日历。
 * 选中态用天空蓝浅底，有 DDL 的日期用分类色小圆点标记，点击联动过滤中间列表。
 */
export function DateRail({ tasks, selectedDate, onSelect }: DateRailProps) {
  const days = useMemo(() => buildDateRange(RAIL_DAYS), [])
  const todayKey = toDateKey(new Date())

  const byDay = useMemo(() => {
    const map = new Map<string, TaskWithDerived[]>()
    for (const task of tasks) {
      const key = toDateKey(new Date(task.dueAt))
      const bucket = map.get(key)
      if (bucket) bucket.push(task)
      else map.set(key, [task])
    }
    return map
  }, [tasks])

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex h-9 items-center justify-between border-b border-hairline-soft px-3.5">
        <span className="eyebrow">时间轴</span>
        <span className="num text-[10px] tracking-[0.08em] text-ink-faint">14D</span>
      </header>

      <div className="p-1.5">
        <button
          type="button"
          data-date="all"
          data-selected={selectedDate === 'all' ? 'true' : 'false'}
          onClick={() => onSelect('all')}
          className={cn(
            'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors',
            selectedDate === 'all'
              ? 'bg-brand-soft text-brand-strong'
              : 'text-ink-soft hover:bg-subtle hover:text-ink',
          )}
        >
          <Layers className={cn('size-3.5 shrink-0', selectedDate === 'all' ? 'text-brand' : 'text-ink-faint')} />
          <span className="text-[12.5px] font-medium">全部任务</span>
          <span className="num ml-auto text-[11px] text-ink-faint">{tasks.length}</span>
        </button>

        <div className="relative mt-1 pt-0.5">
          <span className="absolute top-0.5 bottom-0.5 left-[13px] w-px bg-hairline-soft" aria-hidden />

          {days.map((day) => {
            const key = toDateKey(day)
            const dayTasks = byDay.get(key) ?? []
            const isToday = key === todayKey
            const isSelected = key === selectedDate

            const categories = [...new Set(dayTasks.map((task) => task.categoryId))].slice(0, 3)
            const openCount = dayTasks.filter((task) => !task.completed).length

            return (
              <button
                key={key}
                type="button"
                data-date={key}
                data-selected={isSelected ? 'true' : 'false'}
                onClick={() => onSelect(key)}
                className={cn(
                  'group relative flex h-8 w-full items-center gap-2 rounded-lg pr-2 pl-6 text-left transition-colors',
                  isSelected
                    ? 'bg-brand-soft text-brand-strong'
                    : 'text-ink-soft hover:bg-subtle hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1/2 left-[10px] size-[7px] -translate-y-1/2 rounded-full transition-colors',
                    isSelected
                      ? 'bg-brand ring-[3px] ring-card'
                      : isToday
                        ? 'bg-brand ring-[3px] ring-card'
                        : dayTasks.length > 0
                          ? 'bg-hairline-strong ring-[3px] ring-card'
                          : 'bg-hairline-strong ring-[3px] ring-card',
                  )}
                  aria-hidden
                />

                <span
                  className={cn(
                    'num w-[30px] shrink-0 text-[15px] leading-none',
                    isToday && !isSelected && 'font-medium text-ink',
                  )}
                >
                  {formatNumericMonthDay(day).slice(3)}
                </span>

                <span className={cn('w-8 shrink-0 text-[11.5px] leading-none', isToday && !isSelected && 'text-ink')}>
                  {isToday ? '今天' : WEEKDAY_LABELS[day.getDay()].replace('周', '')}
                </span>

                <span className="ml-auto flex items-center gap-1.5">
                  {categories.map((categoryId) => (
                    <span
                      key={categoryId}
                      className="size-[5px] rounded-full"
                      style={{ backgroundColor: CATEGORY_META[categoryId].fg }}
                      aria-hidden
                    />
                  ))}
                  {dayTasks.length > 0 && (
                    <span className="num w-3 text-right text-[10px] text-ink-faint">
                      {openCount > 0 ? openCount : '✓'}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}