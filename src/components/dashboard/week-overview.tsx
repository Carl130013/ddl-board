import { useMemo } from 'react'

import { addDays, formatNumericMonthDay, startOfDay } from '@/lib/date'
import { CATEGORY_IDS, CATEGORY_META } from '@/lib/meta'
import type { TaskWithDerived } from '@/types/task'

interface WeekOverviewProps {
  tasks: TaskWithDerived[]
}

/** 本周一 00:00（周一为一周起点） */
function startOfWeek(date: Date): Date {
  const day = date.getDay()
  return startOfDay(addDays(date, day === 0 ? -6 : 1 - day))
}

/**
 * 本周概览：本周完成率 + 各分类任务数。
 * 统计口径 = 截止时间落在本周（周一至周日）的任务，含已完成。
 */
export function WeekOverview({ tasks }: WeekOverviewProps) {
  const { rate, done, total, monday, sunday, byCategory } = useMemo(() => {
    const start = startOfWeek(new Date())
    const end = addDays(start, 6)
    const weekTasks = tasks.filter((task) => {
      const due = new Date(task.dueAt)
      return due >= start && due < addDays(end, 1)
    })
    const completed = weekTasks.filter((task) => task.completed).length

    const counts = CATEGORY_IDS.map((categoryId) => ({
      categoryId,
      count: weekTasks.filter((task) => task.categoryId === categoryId).length,
    })).filter((row) => row.count > 0)

    return {
      rate: weekTasks.length === 0 ? 0 : Math.round((completed / weekTasks.length) * 100),
      done: completed,
      total: weekTasks.length,
      monday: start,
      sunday: end,
      byCategory: counts,
    }
  }, [tasks])

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex h-9 items-center justify-between border-b border-hairline-soft px-3.5">
        <span className="eyebrow">本周概览</span>
        <span className="num text-[10px] tracking-[0.04em] text-ink-faint">
          {formatNumericMonthDay(monday)} – {formatNumericMonthDay(sunday)}
        </span>
      </header>

      <div className="px-3.5 pt-3 pb-2.5">
        <div className="flex items-baseline gap-1">
          <span className="num text-[22px] leading-none font-medium tracking-tight text-ink">
            {rate}
          </span>
          <span className="text-[11px] leading-none text-ink-faint">%</span>
          <span className="num ml-auto text-[11px] text-ink-soft">
            {done}/{total}
          </span>
        </div>
        <p className="mt-1 text-[10.5px] text-ink-faint">本周完成率</p>

        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-track">
          <div
            className="h-full rounded-full bg-mint transition-[width] duration-500 ease-out"
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      <div className="border-t border-hairline-soft px-3.5 py-2">
        {byCategory.length === 0 ? (
          <p className="py-1 text-[10.5px] text-ink-faint">本周还没有安排</p>
        ) : (
          <ul className="flex flex-col">
            {byCategory.map(({ categoryId, count }) => {
              const meta = CATEGORY_META[categoryId]
              return (
                <li key={categoryId} className="flex h-[26px] items-center gap-2">
                  <span
                    className="size-[6px] rounded-full"
                    style={{ backgroundColor: meta.fg }}
                    aria-hidden
                  />
                  <span className="text-[11.5px] text-ink-soft">{meta.label}</span>
                  <span className="num ml-auto text-[11px] text-ink">{count}</span>
                  <span className="num w-8 text-right text-[10px] text-ink-faint">
                    {Math.round((count / total) * 100)}%
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}