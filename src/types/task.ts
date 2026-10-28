/**
 * 任务领域模型。
 *
 * 设计原则：
 * 1. 只持久化"事实"，不持久化"结论"——剩余天数、是否逾期都由 dueAt 实时派生，
 *    否则跨过午夜数据就会失真。
 * 2. 时间统一存 ISO 8601 字符串（带偏移量），不做 Date 对象持久化，保证 JSON 往返无损。
 * 3. 分类、优先级使用稳定的字面量 id，展示文案与颜色集中在 `src/lib/meta.ts`。
 */

/** 优先级：只有三档，不预留 P3 */
export type Priority = 'P0' | 'P1' | 'P2'

/** 分类 id，展示名与色值见 CATEGORY_META */
export type CategoryId = 'homework' | 'exam' | 'project' | 'reading' | 'other'

/** 列表排序维度 */
export type SortKey = 'dueAt' | 'priority' | 'createdAt' | 'manual'

/** 状态筛选 */
export type StatusFilter = 'all' | 'active' | 'completed'

/** 列表筛选状态 */
export interface TaskFilter {
  status: StatusFilter
  categoryId: CategoryId | 'all'
  priority: Priority | 'all'
}

export interface Task {
  /** crypto.randomUUID() */
  id: string
  /** 任务名，纯文本，不含标签 */
  title: string
  /** 备注；自然语言输入的原文可留在这里 */
  notes?: string

  categoryId: CategoryId
  priority: Priority

  /**
   * 截止时间，ISO 8601 带时区偏移，例如 '2026-10-29T23:59:00+08:00'。
   * 存储层面永远不存 Date 对象。
   */
  dueAt: string
  /** 是否为"整天型"DDL（没写具体钟点），影响是否展示具体时分 */
  allDay: boolean

  completed: boolean
  /** 完成时刻，用于撤销与统计；未完成时恒为 null */
  completedAt: string | null

  createdAt: string
  updatedAt: string

  /** 同一天内的手动排序位；先留坑，M2 再做拖拽 */
  order?: number
}

/** 派生值：永远不写进 localStorage */
export interface TaskDerived {
  /** 按自然日计算的剩余天数：今天到期为 0，逾期为负数 */
  daysLeft: number
  /** 已逾期（dueAt < now 且未完成） */
  overdue: boolean
  /** 是否今天到期 */
  dueToday: boolean
}

/** 渲染用的任务视图 = 原始数据 + 派生值 */
export type TaskWithDerived = Task & { derived: TaskDerived }

/**
 * localStorage 中保存的完整状态，带 version 便于日后迁移。
 * 除了任务本身，UI 状态（选中日期 / 筛选 / 排序 / 明日计划）也一起记住。
 */
export interface PersistedState {
  version: 1
  tasks: Task[]
  /** "记录明日计划"的文本 */
  tomorrowPlan: string
  /** 当前选中的日期：'YYYY-MM-DD' 或 'all' */
  selectedDate: string
  /** 状态筛选 */
  status: StatusFilter
  /** 排序维度 */
  sortKey: SortKey
  updatedAt: string
}