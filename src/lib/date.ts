/**
 * 纯日期工具：不依赖任何第三方库。
 * 统一按「本地自然日」计算，避免 UTC 偏移把晚上 23:59 的 DDL 算成第二天。
 */

export const MS_PER_DAY = 86_400_000

export const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

export function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

/** Date → 'YYYY-MM-DD'（本地时区） */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 'YYYY-MM-DD' → 当天 00:00（本地时区） */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** 自然日差值：to 比 from 晚 n 天则为 n；同一天为 0 */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY)
}

/** 从今天开始生成 days 天（含今天）的日期列表 */
export function buildDateRange(days: number, from: Date = new Date()): Date[] {
  return Array.from({ length: days }, (_, index) => startOfDay(addDays(from, index)))
}

/** 'HH:mm' */
export function formatClock(dueAt: string): string {
  const date = new Date(dueAt)
  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}

/** 'M月D日' */
export function formatMonthDay(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/** '10.28' — 用于紧凑排布 */
export function formatNumericMonthDay(date: Date): string {
  return `${`${date.getMonth() + 1}`.padStart(2, '0')}.${`${date.getDate()}`.padStart(2, '0')}`
}

/** 2026 / 10 / 28 拆开，给顶栏用 */
export function formatHeaderDate(date: Date): { weekday: string; year: string; monthDay: string } {
  return {
    weekday: WEEKDAY_LABELS[date.getDay()],
    year: `${date.getFullYear()}`,
    monthDay: formatNumericMonthDay(date),
  }
}

export function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/** 剩余天数的自然语言标签 */
export function countdownLabel(daysLeft: number): string {
  if (daysLeft < 0) return `逾期 ${Math.abs(daysLeft)} 天`
  if (daysLeft === 0) return '今天'
  if (daysLeft === 1) return '明天'
  return `剩 ${daysLeft} 天`
}

/** 剩余天数的语气（决定颜色） */
export function countdownTone(daysLeft: number): 'overdue' | 'urgent' | 'soon' | 'later' {
  if (daysLeft < 0) return 'overdue'
  if (daysLeft <= 1) return 'urgent'
  if (daysLeft <= 3) return 'soon'
  return 'later'
}
