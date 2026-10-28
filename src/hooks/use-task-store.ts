import { useCallback, useEffect, useRef, useState } from 'react'

import { SEED_TASKS, SEED_TOMORROW_PLAN } from '@/data/seed'
import type { ParsedTaskInput } from '@/lib/parse-task'
import { hasStoredState, loadState, saveState } from '@/lib/storage'
import type { PersistedState, SortKey, StatusFilter, Task } from '@/types/task'

/** 可编辑字段 */
type TaskPatch = Partial<Pick<Task, 'title' | 'notes' | 'dueAt' | 'allDay' | 'priority' | 'categoryId'>>

function createTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 首次进入注入示例数据；已有存档则原样恢复（包括"清空任务"之后的存档） */
function bootstrap(): PersistedState {
  const loaded = loadState()
  if (hasStoredState()) return loaded
  return { ...loaded, tasks: SEED_TASKS, tomorrowPlan: SEED_TOMORROW_PLAN }
}

/**
 * 任务仓库：单一数据源 + 180ms 防抖落盘。
 * 所有写操作都是不可变更新，便于以后替换成服务端同步。
 */
export interface ImportOutcome {
  added: number
  updated: number
  skipped: number
}

export function useTaskStore() {
  const [state, setState] = useState<PersistedState>(bootstrap)
  const timer = useRef<number | null>(null)
  // 供导入这类"需要精确计数"的操作读取最新快照
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => saveState(state), 180)
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [state])

  const addTask = useCallback((input: ParsedTaskInput) => {
    const now = new Date().toISOString()
    const task: Task = {
      id: createTaskId(),
      title: input.title,
      categoryId: input.categoryId,
      priority: input.priority,
      dueAt: input.dueAt,
      allDay: input.allDay,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    setState((prev) => ({ ...prev, tasks: [task, ...prev.tasks] }))
    return task
  }, [])

  const restoreTask = useCallback((task: Task) => {
    setState((prev) =>
      prev.tasks.some((item) => item.id === task.id)
        ? prev
        : { ...prev, tasks: [task, ...prev.tasks] },
    )
  }, [])

  const toggleTask = useCallback((id: string) => {
    const now = new Date().toISOString()
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: task.completed ? null : now,
              updatedAt: now,
            }
          : task,
      ),
    }))
  }, [])

  const updateTask = useCallback((id: string, patch: TaskPatch) => {
    const now = new Date().toISOString()
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id ? { ...task, ...patch, updatedAt: now } : task,
      ),
    }))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== id) }))
  }, [])

  /** 拖拽排序：按传入的 id 顺序重写 order，一次 setState 完成 */
  const setTaskOrder = useCallback((ids: string[]) => {
    const indexById = new Map(ids.map((id, index) => [id, index]))
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        indexById.has(task.id) ? { ...task, order: indexById.get(task.id) } : task,
      ),
    }))
  }, [])

  /**
   * 应用一份导入数据。
   * merge：按 id 合并，保留 updatedAt 更新的一条；
   * replace：整份替换，并恢复文件里的 UI 状态。
   */
  const applyImport = useCallback(
    (
      incoming: Task[],
      mode: 'merge' | 'replace',
      ui?: Partial<Pick<PersistedState, 'selectedDate' | 'status' | 'sortKey' | 'tomorrowPlan'>>,
    ): ImportOutcome => {
      const prev = stateRef.current

      if (mode === 'replace') {
        setState({
          ...prev,
          ...ui,
          tasks: incoming,
          updatedAt: new Date().toISOString(),
        })
        return { added: incoming.length, updated: 0, skipped: 0 }
      }

      const byId = new Map(prev.tasks.map((task) => [task.id, task]))
      let added = 0
      let updated = 0
      let skipped = 0

      for (const task of incoming) {
        const existing = byId.get(task.id)
        if (!existing) {
          byId.set(task.id, task)
          added += 1
        } else if (new Date(task.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
          byId.set(task.id, task)
          updated += 1
        } else {
          skipped += 1
        }
      }

      setState({ ...prev, tasks: [...byId.values()], updatedAt: new Date().toISOString() })
      return { added, updated, skipped }
    },
    [],
  )

  /** 批量删除（批量管理模式用） */
  const deleteTasks = useCallback((ids: string[]) => {
    const targets = new Set(ids)
    setState((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => !targets.has(task.id)) }))
  }, [])

  /** 批量恢复（撤销删除用） */
  const restoreTasks = useCallback((items: Task[]) => {
    setState((prev) => {
      const existing = new Set(prev.tasks.map((task) => task.id))
      const restored = items.filter((task) => !existing.has(task.id))
      if (restored.length === 0) return prev
      return { ...prev, tasks: [...restored, ...prev.tasks] }
    })
  }, [])

  const setTomorrowPlan = useCallback((tomorrowPlan: string) => {
    setState((prev) => ({ ...prev, tomorrowPlan }))
  }, [])

  const setSelectedDate = useCallback((selectedDate: string) => {
    setState((prev) => ({ ...prev, selectedDate }))
  }, [])

  const setStatus = useCallback((status: StatusFilter) => {
    setState((prev) => ({ ...prev, status }))
  }, [])

  const setSortKey = useCallback((sortKey: SortKey) => {
    setState((prev) => ({ ...prev, sortKey }))
  }, [])

  return {
    tasks: state.tasks,
    tomorrowPlan: state.tomorrowPlan,
    selectedDate: state.selectedDate,
    status: state.status,
    sortKey: state.sortKey,
    addTask,
    restoreTask,
    toggleTask,
    updateTask,
    deleteTask,
    deleteTasks,
    restoreTasks,
    setTaskOrder,
    applyImport,
    setTomorrowPlan,
    setSelectedDate,
    setStatus,
    setSortKey,
  }
}