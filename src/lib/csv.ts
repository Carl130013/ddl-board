import { formatClock } from '@/lib/date'
import { CATEGORY_META, PRIORITY_META } from '@/lib/meta'
import type { Task } from '@/types/task'

/** 表头固定，方便直接用 WPS / Excel 打开或粘进表格 */
export const CSV_HEADERS = ['任务名称', '截止时间', '优先级', '分类', '完成状态'] as const

const pad = (value: number) => `${value}`.padStart(2, '0')

/** 2026-10-28 23:59 —— 选这个格式是因为 Excel 能识别成日期，排序不会乱 */
function formatDueCell(task: Task): string {
  const date = new Date(task.dueAt)
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return task.allDay ? `${day} 全天` : `${day} ${formatClock(task.dueAt)}`
}

/**
 * CSV 单元格：
 * 1. 双引号转义（RFC 4180）
 * 2. 以 = + - @ 开头的文本加前导单引号，避免被 Excel 当成公式执行
 */
function escapeCell(value: string): string {
  let text = value.replace(/"/g, '""')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text}"`
}

/**
 * 生成 CSV 文本。
 * - 带 UTF-8 BOM，否则 WPS / Excel 打开中文是乱码
 * - CRLF 换行，Windows 表格软件兼容性最好
 * - 按截止时间升序，方便直接看
 */
export function buildTasksCsv(tasks: Task[]): string {
  const sorted = [...tasks].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())

  const rows = sorted.map((task) =>
    [
      task.title,
      formatDueCell(task),
      PRIORITY_META[task.priority].label,
      CATEGORY_META[task.categoryId].label,
      task.completed ? '已完成' : '未完成',
    ]
      .map(escapeCell)
      .join(','),
  )

  // BOM 让 WPS/Excel 认 UTF-8；SEP=, 显式声明分隔符，避免被本地化设置拆错列
  return `\uFEFFSEP=,\r\n${CSV_HEADERS.join(',')}\r\n${rows.join('\r\n')}\r\n`
}