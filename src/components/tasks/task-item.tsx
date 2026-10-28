import { useEffect, useRef, useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Check, Pencil, Trash2 } from 'lucide-react'

import { Tag } from '@/components/ui/tag'
import { countdownLabel, countdownTone, formatClock, formatNumericMonthDay } from '@/lib/date'
import { CATEGORY_META, PRIORITY_META } from '@/lib/meta'
import { cn } from '@/lib/utils'
import type { TaskWithDerived } from '@/types/task'

export interface TaskItemHandlers {
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onOpen: (id: string) => void
}

export interface TaskSelection {
  selectionMode: boolean
  selected: boolean
  onSelect: (id: string) => void
}

export interface TaskItemProps extends TaskItemHandlers, TaskSelection {
  task: TaskWithDerived
}

const TONE_COLOR: Record<ReturnType<typeof countdownTone>, string> = {
  overdue: 'var(--danger)',
  urgent: 'var(--warn)',
  soon: 'var(--ink-soft)',
  later: 'var(--ink-faint)',
}

const EASE = [0.16, 1, 0.3, 1] as const

const ROW_CLASS =
  'group relative flex h-9 items-center gap-2.5 px-3 transition-colors hover:bg-hover'

function TaskRow({
  task,
  onToggle,
  onDelete,
  onRename,
  selectionMode,
  selected,
  onSelect,
}: TaskItemProps) {
  const category = CATEGORY_META[task.categoryId]
  const priority = PRIORITY_META[task.priority]
  const tone = countdownTone(task.derived.daysLeft)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!editing) return
    setDraft(task.title)
    const id = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => window.clearTimeout(id)
  }, [editing, task.title])

  function commit() {
    const value = draft.trim()
    if (value && value !== task.title) onRename(task.id, value)
    setEditing(false)
  }

  const dueDate = new Date(task.dueAt)
  const dueLabel = task.allDay
    ? `${formatNumericMonthDay(dueDate)} 全天`
    : `${formatNumericMonthDay(dueDate)} ${formatClock(task.dueAt)}`

  return (
    <>
      <span
        className="absolute top-1/2 left-0 h-4 w-[2px] -translate-y-1/2 rounded-full transition-opacity duration-300"
        style={{ backgroundColor: priority.fg, opacity: task.completed ? 0.15 : 0.45 }}
        aria-hidden
      />

      {selectionMode ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={selected ? '取消选择' : '选择任务'}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(task.id)
          }}
          className="group/check -m-1 flex size-[26px] shrink-0 items-center justify-center rounded-md"
        >
          <span
            className={cn(
              'flex size-[16px] items-center justify-center rounded-[5px] border transition-colors duration-150',
              selected
                ? 'border-transparent bg-brand text-white'
                : 'border-hairline-strong bg-card text-transparent group-hover/check:border-ink-faint',
            )}
          >
            <Check className="size-[11px]" strokeWidth={3.4} />
          </span>
        </button>
      ) : (
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={task.completed ? '标记为未完成' : '标记为完成'}
          onClick={() => onToggle(task.id)}
          className="group/check -m-1 flex size-[26px] shrink-0 items-center justify-center rounded-md"
        >
          <span
            className={cn(
              'flex size-[16px] items-center justify-center rounded-[5px] border transition-colors duration-200',
              task.completed
                ? 'border-transparent bg-brand text-white'
                : 'border-hairline-strong bg-card text-transparent group-hover/check:border-ink-faint',
            )}
          >
            <motion.span
              initial={false}
              animate={{ scale: task.completed ? 1 : 0.5, opacity: task.completed ? 1 : 0 }}
              transition={{ duration: 0.16, ease: EASE }}
              className="flex"
            >
              <Check className="size-[11px]" strokeWidth={3.2} />
            </motion.span>
          </span>
        </button>
      )}

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') {
              setDraft(task.title)
              setEditing(false)
            }
          }}
          className="h-6 min-w-0 flex-1 rounded-md border border-brand-line bg-card px-1.5 text-[13px] text-ink ring-2 ring-brand/10 outline-none"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">
          <span
            className={cn(
              'relative inline-block max-w-full truncate align-bottom text-[13px] leading-[1.2] transition-colors duration-300',
              task.completed ? 'text-ink-faint' : 'text-ink',
            )}
            title={task.title}
          >
            <motion.span
              aria-hidden
              data-strike
              className="absolute top-1/2 left-0 h-[1.5px] w-full origin-left rounded-full bg-ink-ghost"
              initial={false}
              animate={{ scaleX: task.completed ? 1 : 0, opacity: task.completed ? 1 : 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            />
            {task.title}
          </span>
        </span>
      )}

      <Tag tone={category}>{category.label}</Tag>
      <Tag tone={priority}>{priority.label}</Tag>

      <span className="num hidden w-[76px] shrink-0 text-right text-[11px] leading-none text-ink-faint sm:inline">
        {dueLabel}
      </span>

      <span
        className="num w-[60px] shrink-0 text-right text-[11.5px] leading-none"
        style={{ color: task.completed ? 'var(--ink-ghost)' : TONE_COLOR[tone] }}
      >
        {task.completed ? '已完成' : countdownLabel(task.derived.daysLeft)}
      </span>

      {!selectionMode && (
        <div
          className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center gap-0.5 pl-10 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
          style={{ background: 'linear-gradient(90deg, color-mix(in oklab, var(--hover) 0%, transparent) 0%, var(--hover) 38%)' }}
        >
          <button
            type="button"
            aria-label="编辑标题"
            onClick={() => setEditing(true)}
            className="flex size-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-card hover:text-ink"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="删除任务"
            onClick={() => onDelete(task.id)}
            className="flex size-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-card hover:text-danger"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </>
  )
}

/** 分组列表里的普通行 */
export function TaskItem(props: TaskItemProps) {
  const { task, onOpen, onSelect, selectionMode, selected } = props

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18, ease: EASE }}
      className={cn(ROW_CLASS, selected && 'bg-brand-soft hover:bg-brand-soft')}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button, input, textarea')) return
        if (selectionMode) onSelect(task.id)
        else onOpen(task.id)
      }}
    >
      <TaskRow {...props} />
    </motion.li>
  )
}

/** 手动排序模式下的行：整行可拖拽（批量模式下禁用拖拽，避免和选择冲突） */
export function SortableTaskItem(props: TaskItemProps) {
  const { task, onOpen, onSelect, selectionMode, selected } = props

  return (
    <Reorder.Item
      value={task.id}
      dragListener={!selectionMode}
      className={cn(
        ROW_CLASS,
        !selectionMode && 'cursor-grab active:cursor-grabbing',
        selected && 'bg-brand-soft hover:bg-brand-soft',
      )}
      whileDrag={{
        backgroundColor: 'var(--card)',
        boxShadow: 'var(--shadow-drag)',
        borderRadius: 10,
        zIndex: 30,
      }}
      onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('button, input, textarea')) return
        if (selectionMode) onSelect(task.id)
        else onOpen(task.id)
      }}
    >
      <TaskRow {...props} />
    </Reorder.Item>
  )
}