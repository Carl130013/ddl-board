import type { PersistedState } from '@/types/task'

export const STORAGE_KEY = 'ddl-workbench.v1'

export const SCHEMA_VERSION = 1 as const

export function createEmptyState(): PersistedState {
  return {
    version: SCHEMA_VERSION,
    tasks: [],
    tomorrowPlan: '',
    selectedDate: 'all',
    status: 'all',
    sortKey: 'dueAt',
    updatedAt: new Date().toISOString(),
  }
}

/** localStorage 里是否已经有本应用的数据（用来区分"首次进入"和"用户清空了任务"） */
export function hasStoredState(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return false
  }
}

function isPersistedState(value: unknown): value is Partial<PersistedState> {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<PersistedState>
  return Array.isArray(candidate.tasks)
}

/**
 * 读取本地状态。
 * 任何异常（无痕模式、配额、脏数据）都降级为空状态，绝不阻塞首屏。
 * 旧版本缺字段时用默认值补齐，不做破坏性丢弃。
 */
export function loadState(): PersistedState {
  if (typeof window === 'undefined') return createEmptyState()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()

    const parsed: unknown = JSON.parse(raw)
    if (!isPersistedState(parsed)) return createEmptyState()

    return {
      ...createEmptyState(),
      ...parsed,
      tasks: parsed.tasks ?? [],
    }
  } catch {
    return createEmptyState()
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    )
  } catch {
    // 写入失败（配额 / 隐私模式）不打断交互，静默降级为本会话内存态
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}