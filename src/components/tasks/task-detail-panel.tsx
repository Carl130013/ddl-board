import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Trash2, X } from 'lucide-react'

import { formatClock, formatNumericMonthDay, toDateKey } from '@/lib/date'
import { CATEGORY_IDS, CATEGORY_META, PRIORITY_META, PRIORITY_ORDER, tagStyle } from '@/lib/meta'
import { cn } from '@/lib/utils'
import type { CategoryId, Priority, Task, TaskWithDerived } from '@/types/task'

type TaskPatch = Partial<Pick<Task, 'title' | 'notes' | 'dueAt' | 'allDay' | 'priority' | 'categoryId'>>

interface TaskDetailPanelProps {
  task: TaskWithDerived | null
  onClose: () => void
  onPatch: (id: string, patch: TaskPatch) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * 任务详情抽屉：标题、状态、分类、优先级、截止时间、备注全部可改。
 * 改动即时写回 store（本地操作成本极低），不设"保存"按钮。
 */
export function TaskDetailPanel({ task, onClose, onPatch, onDelete, onToggle }: TaskDetailPanelProps) {
  useEffect(() => {
    if (!task) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [task, onClose])

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-[#0F172A]/12 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            key="panel"
            className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-hairline bg-card shadow-panel"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
            role="dialog"
            aria-label="任务详情"
          >
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-hairline-soft px-5">
              <span className="eyebrow">任务详情</span>
              <button
                type="button"
                aria-label="关闭"
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-subtle hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* 标题 */}
              <textarea
                value={task.title}
                rows={2}
                onChange={(event) => onPatch(task.id, { title: event.target.value })}
                className="w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-snug font-medium text-ink outline-none placeholder:text-ink-ghost"
                placeholder="任务标题"
              />

              <button
                type="button"
                onClick={() => onToggle(task.id)}
                className={cn(
                  'mt-2 inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] transition-colors',
                  task.completed
                    ? 'border-brand-line bg-brand-soft text-brand-strong'
                    : 'border-hairline bg-card text-ink-soft hover:border-hairline-strong hover:text-ink',
                )}
              >
                <Check className="size-3.5" strokeWidth={3} />
                {task.completed ? '已完成，点击撤销' : '标记为完成'}
              </button>

              <Divider />

              {/* 分类 */}
              <Field label="分类">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_IDS.map((categoryId) => {
                    const meta = CATEGORY_META[categoryId]
                    const selected = task.categoryId === categoryId
                    return (
                      <Chip
                        key={categoryId}
                        selected={selected}
                        tone={meta}
                        onClick={() => onPatch(task.id, { categoryId: categoryId as CategoryId })}
                      >
                        {meta.label}
                      </Chip>
                    )
                  })}
                </div>
              </Field>

              {/* 优先级 */}
              <Field label="优先级">
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITY_ORDER.map((priority) => {
                    const meta = PRIORITY_META[priority]
                    const selected = task.priority === priority
                    return (
                      <Chip
                        key={priority}
                        selected={selected}
                        tone={meta}
                        onClick={() => onPatch(task.id, { priority: priority as Priority })}
                      >
                        {meta.label}
                        <span className="ml-1 opacity-70">{meta.hint}</span>
                      </Chip>
                    )
                  })}
                </div>
              </Field>

              {/* 截止时间 */}
              <Field label="截止时间">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={toDateKey(new Date(task.dueAt))}
                    onChange={(event) => {
                      const [year, month, day] = event.target.value.split('-').map(Number)
                      if (!year || !month || !day) return
                      const due = new Date(task.dueAt)
                      const next = new Date(year, month - 1, day, due.getHours(), due.getMinutes())
                      onPatch(task.id, { dueAt: next.toISOString() })
                    }}
                    className="num h-8 rounded-lg border border-hairline bg-card px-2 text-[12px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand/10"
                  />

                  <input
                    type="time"
                    value={formatClock(task.dueAt)}
                    disabled={task.allDay}
                    onChange={(event) => {
                      const [hour, minute] = event.target.value.split(':').map(Number)
                      if (Number.isNaN(hour) || Number.isNaN(minute)) return
                      const next = new Date(task.dueAt)
                      next.setHours(hour, minute, 0, 0)
                      onPatch(task.id, { dueAt: next.toISOString(), allDay: false })
                    }}
                    className="num h-8 rounded-lg border border-hairline bg-card px-2 text-[12px] text-ink outline-none focus:border-brand-line focus:ring-2 focus:ring-brand/10 disabled:bg-subtle disabled:text-ink-ghost"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const next = new Date(task.dueAt)
                      if (task.allDay) {
                        onPatch(task.id, { allDay: false })
                        return
                      }
                      next.setHours(23, 59, 0, 0)
                      onPatch(task.id, { allDay: true, dueAt: next.toISOString() })
                    }}
                    className={cn(
                      'h-8 rounded-lg border px-2.5 text-[11.5px] transition-colors',
                      task.allDay
                        ? 'border-brand-line bg-brand-soft text-brand-strong'
                        : 'border-hairline bg-card text-ink-soft hover:text-ink',
                    )}
                  >
                    全天
                  </button>
                </div>
              </Field>

              {/* 备注 */}
              <Field label="备注">
                <textarea
                  value={task.notes ?? ''}
                  rows={4}
                  onChange={(event) => onPatch(task.id, { notes: event.target.value })}
                  placeholder="补充信息、链接、复习范围…"
                  className="w-full resize-none rounded-lg border border-hairline bg-subtle px-2.5 py-2 text-[12.5px] leading-relaxed text-ink outline-none placeholder:text-ink-ghost focus:border-brand-line focus:ring-2 focus:ring-brand/10"
                />
              </Field>

              <Divider />

              <div className="flex items-center justify-between">
                <span className="num text-[10.5px] text-ink-faint">
                  创建 {formatStamp(task.createdAt)}
                </span>
                <span className="num text-[10.5px] text-ink-faint">
                  更新 {formatStamp(task.updatedAt)}
                </span>
              </div>
            </div>

            <footer className="flex shrink-0 items-center justify-between border-t border-hairline-soft px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  onDelete(task.id)
                  onClose()
                }}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-[12px] text-ink-faint transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-3.5" />
                删除任务
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-8 rounded-lg bg-brand px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-brand-hover"
              >
                完成
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function Divider() {
  return <div className="my-4 h-px bg-subtle" />
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[10.5px] tracking-[0.08em] text-ink-faint uppercase">{label}</p>
      {children}
    </div>
  )
}

function Chip({
  selected,
  tone,
  onClick,
  children,
}: {
  selected: boolean
  tone: { fg: string; bg: string; border: string }
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={selected ? tagStyle(tone) : undefined}
      className={cn(
        'inline-flex h-7 items-center rounded-md border px-2.5 text-[11.5px] font-medium transition-all',
        selected
          ? 'ring-2 ring-brand/0'
          : 'border-hairline bg-card text-ink-soft hover:border-hairline-strong hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function formatStamp(iso: string): string {
  const date = new Date(iso)
  return `${formatNumericMonthDay(date)} ${formatClock(iso)}`
}