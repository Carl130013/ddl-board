import { daysBetween, startOfDay, toDateKey } from '@/lib/date'
import { PRIORITY_ORDER } from '@/lib/meta'
import type { SortKey, Task, TaskDerived, TaskFilter, TaskWithDerived } from '@/types/task'

/** 由 dueAt 实时派生剩余天数 / 是否逾期 / 是否今天到期 */
export function deriveTask(task: Task, now: Date = new Date()): TaskDerived {
  const due = new Date(task.dueAt)
  const daysLeft = daysBetween(now, due)
  return {
    daysLeft,
    overdue: !task.completed && due.getTime() < now.getTime(),
    dueToday: daysLeft === 0,
  }
}

export function withDerived(tasks: Task[], now: Date = new Date()): TaskWithDerived[] {
  return tasks.map((task) => ({ ...task, derived: deriveTask(task, now) }))
}

/** 任务是否落在某一天（本地自然日） */
export function isDueOn(task: Task, dateKey: string): boolean {
  return toDateKey(new Date(task.dueAt)) === dateKey
}

export function filterTasks(tasks: TaskWithDerived[], filter: TaskFilter): TaskWithDerived[] {
  return tasks.filter((task) => {
    if (filter.status === 'active' && task.completed) return false
    if (filter.status === 'completed' && !task.completed) return false
    if (filter.categoryId !== 'all' && task.categoryId !== filter.categoryId) return false
    if (filter.priority !== 'all' && task.priority !== filter.priority) return false
    return true
  })
}

/**
 * 排序：
 * - dueAt：截止时间升序，已完成的沉底
 * - priority：P0 → P2，同级按截止时间
 * - createdAt：最新创建在前
 */
export function sortTasks(tasks: TaskWithDerived[], key: SortKey): TaskWithDerived[] {
  const list = [...tasks]

  const completedWeight = (task: TaskWithDerived) => (task.completed ? 1 : 0)

  list.sort((a, b) => {
    if (key === 'manual') {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER
      if (orderA !== orderB) return orderA - orderB
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    }

    const completedDelta = completedWeight(a) - completedWeight(b)
    if (completedDelta !== 0) return completedDelta

    if (key === 'priority') {
      const delta = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
      if (delta !== 0) return delta
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    }

    if (key === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  })

  return list
}

/** 逾期且未完成 */
export function selectOverdue(tasks: TaskWithDerived[]): TaskWithDerived[] {
  return tasks.filter((task) => task.derived.overdue)
}

/** 今天到期（含已完成），用于环形进度分母 */
export function selectDueToday(tasks: TaskWithDerived[]): TaskWithDerived[] {
  const todayKey = toDateKey(startOfDay(new Date()))
  return tasks.filter((task) => toDateKey(new Date(task.dueAt)) === todayKey)
}
