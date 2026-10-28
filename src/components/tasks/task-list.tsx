import { useMemo } from 'react'
import { AnimatePresence, Reorder } from 'framer-motion'
import { Inbox, MoveVertical } from 'lucide-react'

import { SortableTaskItem, TaskItem } from '@/components/tasks/task-item'
import { fromDateKey, formatMonthDay, WEEKDAY_LABELS } from '@/lib/date'
import type { SortKey, TaskWithDerived } from '@/types/task'

interface TaskListProps {
  tasks: TaskWithDerived[]
  /** 'all' 或 'YYYY-MM-DD' */
  selectedDate: string
  sortKey: SortKey
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onOpen: (id: string) => void
  onReorder: (ids: string[]) => void
  /** 搜索关键词，仅用于空状态文案 */
  query?: string
  /** 批量管理模式 */
  selectionMode: boolean
  selectedIds: Set<string>
  onSelect: (id: string) => void
}

interface Group {
  key: string
  label: string
  dot: string
  tasks: TaskWithDerived[]
}

/**
 * 任务列表。
 * - 分组模式：逾期 / 今天 / 接下来 / 已完成，逾期永远置顶
 * - 手动排序模式：平铺 + 拖拽
 * - 批量管理模式：行首换成选择框，点整行即选中
 */
export function TaskList({
  tasks,
  selectedDate,
  sortKey,
  onToggle,
  onDelete,
  onRename,
  onOpen,
  onReorder,
  query = '',
  selectionMode,
  selectedIds,
  onSelect,
}: TaskListProps) {
  const groups = useMemo<Group[]>(() => {
    if (selectedDate !== 'all') {
      const date = fromDateKey(selectedDate)
      return [
        {
          key: selectedDate,
          label: `${formatMonthDay(date)} · ${WEEKDAY_LABELS[date.getDay()]}`,
          dot: 'var(--brand)',
          tasks,
        },
      ]
    }

    const overdue = tasks.filter((task) => !task.completed && task.derived.overdue)
    const today = tasks.filter(
      (task) => !task.completed && !task.derived.overdue && task.derived.dueToday,
    )
    const upcoming = tasks.filter(
      (task) => !task.completed && !task.derived.overdue && task.derived.daysLeft > 0,
    )
    const completed = tasks.filter((task) => task.completed)

    return [
      { key: 'overdue', label: '已逾期', dot: 'var(--danger)', tasks: overdue },
      { key: 'today', label: '今天', dot: 'var(--brand)', tasks: today },
      { key: 'upcoming', label: '接下来', dot: 'var(--mint)', tasks: upcoming },
      { key: 'completed', label: '已完成', dot: 'var(--ink-ghost)', tasks: completed },
    ].filter((group) => group.tasks.length > 0)
  }, [tasks, selectedDate])

  const isEmpty = tasks.length === 0

  if (isEmpty) {
    return (
      <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-hairline-strong bg-card/60 py-12">
        <Inbox className="size-5 text-ink-ghost" />
        <p className="text-[12px] text-ink-faint">
          {query
            ? `没有匹配「${query}」的任务`
            : selectedDate === 'all'
              ? '还没有任务，从上面那句话开始'
              : '这一天没有 DDL，安心'}
        </p>
      </div>
    )
  }

  const selectionProps = (task: TaskWithDerived) => ({
    selectionMode,
    selected: selectedIds.has(task.id),
    onSelect,
  })

  if (sortKey === 'manual') {
    return (
      <div className="mt-4 pb-4">
        <section className="surface-card overflow-hidden">
          <header className="flex h-9 items-center gap-2 border-b border-hairline-soft px-3">
            <MoveVertical className="size-3.5 text-brand" />
            <h2 className="text-[11.5px] font-medium text-ink-soft">手动排序</h2>
            <span className="num text-[10.5px] text-ink-ghost">{tasks.length}</span>
            <span className="ml-auto text-[10.5px] text-ink-faint">
              {selectionMode ? '批量模式：点整行选择' : '拖动行调整顺序'}
            </span>
          </header>

          <Reorder.Group
            axis="y"
            values={tasks.map((task) => task.id)}
            onReorder={(ids) => onReorder(ids as string[])}
            className="divide-y divide-hairline-soft"
          >
            {tasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onRename={onRename}
                onOpen={onOpen}
                {...selectionProps(task)}
              />
            ))}
          </Reorder.Group>
        </section>
      </div>
    )
  }

  return (
    <div className="mt-4 flex flex-col gap-3.5 pb-4">
      {groups.map((group) => (
        <section key={group.key} className="surface-card overflow-hidden">
          <header className="flex h-9 items-center gap-2 border-b border-hairline-soft px-3">
            <span
              className="size-[6px] rounded-full"
              style={{ backgroundColor: group.dot }}
              aria-hidden
            />
            <h2 className="text-[11.5px] font-medium text-ink-soft">{group.label}</h2>
            <span className="num text-[10.5px] text-ink-ghost">{group.tasks.length}</span>
          </header>

          <ul className="divide-y divide-hairline-soft">
            <AnimatePresence initial={false}>
              {group.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onRename={onRename}
                  onOpen={onOpen}
                  {...selectionProps(task)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      ))}
    </div>
  )
}