import { downloadText, timestampedName } from '@/lib/download'
import { CATEGORY_IDS, PRIORITY_ORDER } from '@/lib/meta'
import type { PersistedState, SortKey, StatusFilter, Task } from '@/types/task'

export const BACKUP_APP_ID = 'ddl-workbench'
export const BACKUP_VERSION = 1

export interface BackupFile {
  app: string
  schemaVersion: number
  exportedAt: string
  state: PersistedState
}

export interface ImportResult {
  state: PersistedState
  /** 结构合法、可导入的任务数 */
  valid: number
  /** 被跳过的损坏记录数 */
  invalid: number
  /** 文件里是否带了 UI 状态（筛选 / 明日计划等） */
  hasUiState: boolean
  /** 导出时间（如果文件里有） */
  exportedAt: string | null
}

type RawRecord = Record<string, unknown>

/** 打包成可直接落盘的备份对象 */
export function buildBackup(state: PersistedState): BackupFile {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    state,
  }
}

function asRecord(value: unknown): RawRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RawRecord)
    : null
}

function asIso(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 单条任务清洗：字段缺失用安全默认值补齐，关键字段（标题、截止时间）不合法则整条丢弃 */
function sanitizeTask(raw: unknown, now: string): Task | null {
  const record = asRecord(raw)
  if (!record) return null

  const title = typeof record.title === 'string' ? record.title.trim() : ''
  if (!title) return null

  const dueAt = asIso(record.dueAt)
  if (!dueAt) return null

  const priority = PRIORITY_ORDER.includes(record.priority as (typeof PRIORITY_ORDER)[number])
    ? (record.priority as Task['priority'])
    : 'P2'

  const categoryId = CATEGORY_IDS.includes(record.categoryId as (typeof CATEGORY_IDS)[number])
    ? (record.categoryId as Task['categoryId'])
    : 'other'

  const completed = record.completed === true
  const completedAt = completed ? (asIso(record.completedAt) ?? dueAt) : null

  return {
    id: typeof record.id === 'string' && record.id ? record.id : newId(),
    title,
    notes: typeof record.notes === 'string' ? record.notes : undefined,
    categoryId,
    priority,
    dueAt,
    allDay: record.allDay === true,
    completed,
    completedAt,
    createdAt: asIso(record.createdAt) ?? now,
    updatedAt: asIso(record.updatedAt) ?? now,
    order: typeof record.order === 'number' && Number.isFinite(record.order) ? record.order : undefined,
  }
}

function sanitizeUi(raw: RawRecord | null): Partial<PersistedState> | null {
  if (!raw) return null
  const patch: Partial<PersistedState> = {}

  if (typeof raw.selectedDate === 'string') patch.selectedDate = raw.selectedDate
  if (raw.status === 'all' || raw.status === 'active' || raw.status === 'completed') {
    patch.status = raw.status as StatusFilter
  }
  if (
    raw.sortKey === 'dueAt' ||
    raw.sortKey === 'priority' ||
    raw.sortKey === 'createdAt' ||
    raw.sortKey === 'manual'
  ) {
    patch.sortKey = raw.sortKey as SortKey
  }
  if (typeof raw.tomorrowPlan === 'string') patch.tomorrowPlan = raw.tomorrowPlan

  return Object.keys(patch).length > 0 ? patch : null
}

/**
 * 解析备份文件。
 * 兼容三种形态：完整备份对象、裸的 PersistedState、以及一个任务数组。
 * 任何一层坏数据都不会让整份文件失败——坏记录单独跳过并计数。
 */
export function parseBackup(
  raw: string,
): { ok: true; result: ImportResult } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: '不是合法的 JSON 文件' }
  }

  const now = new Date().toISOString()
  let tasksRaw: unknown[] | null = null
  let uiSource: RawRecord | null = null
  let exportedAt: string | null = null

  if (Array.isArray(parsed)) {
    tasksRaw = parsed
  } else {
    const record = asRecord(parsed)
    if (!record) return { ok: false, error: '文件内容不是对象或数组' }

    if (Array.isArray(record.tasks)) {
      tasksRaw = record.tasks
      uiSource = record
      exportedAt = asIso(record.exportedAt)
    } else {
      const state = asRecord(record.state)
      if (state && Array.isArray(state.tasks)) {
        tasksRaw = state.tasks
        uiSource = state
        exportedAt = asIso(record.exportedAt)
      }
    }
  }

  if (!tasksRaw) return { ok: false, error: '文件里没有找到任务列表（tasks）' }

  const tasks: Task[] = []
  let invalid = 0
  for (const item of tasksRaw) {
    const task = sanitizeTask(item, now)
    if (task) tasks.push(task)
    else invalid += 1
  }

  if (tasks.length === 0 && invalid > 0) {
    return { ok: false, error: `文件里的 ${invalid} 条任务全部无法识别` }
  }

  const ui = sanitizeUi(uiSource)

  return {
    ok: true,
    result: {
      state: {
        version: 1,
        tasks,
        tomorrowPlan: typeof ui?.tomorrowPlan === 'string' ? ui.tomorrowPlan : '',
        selectedDate: typeof ui?.selectedDate === 'string' ? ui.selectedDate : 'all',
        status: ui?.status ?? 'all',
        sortKey: ui?.sortKey ?? 'dueAt',
        updatedAt: now,
      },
      valid: tasks.length,
      invalid,
      hasUiState: Boolean(ui),
      exportedAt,
    },
  }
}

/** 文件名：ddl-backup-20261028-2231.json */
export function backupFileName(date: Date = new Date()): string {
  return timestampedName('ddl-backup', 'json', date)
}

/** 触发浏览器下载；返回文件名便于 toast 回显 */
export function downloadBackup(state: PersistedState): string {
  const name = backupFileName()
  downloadText(JSON.stringify(buildBackup(state), null, 2), name, 'application/json')
  return name
}