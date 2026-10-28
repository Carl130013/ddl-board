import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react'

import { toDateKey } from '@/lib/date'
import type { TaskWithDerived } from '@/types/task'

interface FocusRingProps {
  tasks: TaskWithDerived[]
}

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * 今日计划与播报：环形进度 + 三个关键数字。
 * 分母 = 今天到期的任务总数（含已完成）；逾期任务单独提示。
 */
export function FocusRing({ tasks }: FocusRingProps) {
  const todayKey = toDateKey(new Date())

  const dueToday = tasks.filter((task) => toDateKey(new Date(task.dueAt)) === todayKey)
  const doneToday = dueToday.filter((task) => task.completed)
  const openToday = dueToday.length - doneToday.length
  const overdue = tasks.filter((task) => task.derived.overdue)

  const total = dueToday.length
  const progress = total === 0 ? 0 : doneToday.length / total
  const percent = Math.round(progress * 100)

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex h-9 items-center justify-between border-b border-hairline-soft px-3.5">
        <span className="eyebrow">今日计划</span>
        <span className="num text-[10px] tracking-[0.08em] text-ink-faint">DAILY</span>
      </header>

      <div className="flex items-center gap-4 px-4 py-4">
        <div className="relative shrink-0">
          <svg viewBox="0 0 108 108" className="size-[92px] -rotate-90">
            <circle cx="54" cy="54" r={RADIUS} fill="none" stroke="var(--hairline)" strokeWidth="6" />
            <circle
              cx="54"
              cy="54"
              r={RADIUS}
              fill="none"
              stroke="var(--brand)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="num text-[17px] leading-none font-medium text-ink">
              {doneToday.length}
              <span className="text-ink-ghost">/</span>
              {total}
            </span>
            <span className="num mt-1 text-[10px] tracking-[0.06em] text-ink-faint">{percent}%</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <StatRow
            icon={<CircleDashed className="size-3.5" />}
            label="今日待办"
            value={openToday}
            tone="sky"
          />
          <StatRow
            icon={<CheckCircle2 className="size-3.5" />}
            label="今日已完成"
            value={doneToday.length}
            tone="mint"
          />
          <StatRow
            icon={<AlertTriangle className="size-3.5" />}
            label="已逾期"
            value={overdue.length}
            tone={overdue.length > 0 ? 'rose' : 'muted'}
          />
        </div>
      </div>
    </section>
  )
}

function StatRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'sky' | 'mint' | 'rose' | 'muted'
}) {
  const color =
    tone === 'rose' ? 'var(--danger)' : tone === 'mint' ? 'var(--mint)' : tone === 'sky' ? 'var(--brand)' : 'var(--ink-faint)'

  return (
    <div className="flex items-center gap-2">
      <span style={{ color }} className="flex">
        {icon}
      </span>
      <span className="truncate text-[11.5px] text-ink-soft">{label}</span>
      <span className="num ml-auto text-[12.5px] text-ink">{value}</span>
    </div>
  )
}