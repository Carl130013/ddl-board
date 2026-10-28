import { addDays } from '@/lib/date'
import type { Task } from '@/types/task'

/**
 * 首次进入时的示例数据（仅当 localStorage 为空时注入）。
 * 时间全部相对"今天"生成，保证任何一天打开都能看到逾期/今天/未来的完整状态。
 */

function dueAt(offsetDays: number, hour: number, minute = 0): string {
  const date = addDays(new Date(), offsetDays)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function createdAt(offsetDays: number, hour = 9): string {
  const date = addDays(new Date(), offsetDays)
  date.setHours(hour, 12, 0, 0)
  return date.toISOString()
}

function task(input: Omit<Task, 'createdAt' | 'updatedAt' | 'completedAt' | 'allDay'> & {
  createdAt?: string
  allDay?: boolean
  completedAt?: string | null
}): Task {
  const created = input.createdAt ?? createdAt(-7)
  return {
    allDay: input.allDay ?? false,
    completedAt: input.completedAt ?? null,
    createdAt: created,
    updatedAt: created,
    ...input,
  }
}

export const SEED_TASKS: Task[] = [
  task({
    id: 'seed-1',
    title: '高数第七章习题 7.1–7.6',
    categoryId: 'homework',
    priority: 'P0',
    dueAt: dueAt(0, 23, 59),
    completed: false,
    createdAt: createdAt(-3),
  }),
  task({
    id: 'seed-2',
    title: '操作系统实验报告：进程调度',
    categoryId: 'homework',
    priority: 'P0',
    dueAt: dueAt(-1, 18),
    completed: false,
    createdAt: createdAt(-6),
  }),
  task({
    id: 'seed-3',
    title: '数据结构期中考试',
    categoryId: 'exam',
    priority: 'P1',
    dueAt: dueAt(5, 9),
    completed: false,
    notes: '教三 204，闭卷，带学生证',
    createdAt: createdAt(-10),
  }),
  task({
    id: 'seed-4',
    title: '数据库课程设计 · ER 图评审',
    categoryId: 'project',
    priority: 'P1',
    dueAt: dueAt(2, 14),
    completed: false,
    createdAt: createdAt(-4),
  }),
  task({
    id: 'seed-5',
    title: '组会 PPT：图神经网络的过平滑问题',
    categoryId: 'project',
    priority: 'P0',
    dueAt: dueAt(0, 20),
    completed: true,
    completedAt: dueAt(0, 15),
    createdAt: createdAt(-2),
  }),
  task({
    id: 'seed-6',
    title: '英语六级报名确认',
    categoryId: 'other',
    priority: 'P1',
    dueAt: dueAt(1, 12),
    allDay: true,
    completed: false,
    createdAt: createdAt(-1),
  }),
  task({
    id: 'seed-7',
    title: '《深入理解计算机系统》第 6 章 · 存储器层次结构',
    categoryId: 'reading',
    priority: 'P2',
    dueAt: dueAt(9, 22),
    completed: false,
    notes: '读完 6.1–6.4，做课后 6.3 / 6.5',
    createdAt: createdAt(-5),
  }),
  task({
    id: 'seed-8',
    title: '线性代数作业 · 特征值与特征向量',
    categoryId: 'homework',
    priority: 'P2',
    dueAt: dueAt(-2, 23, 59),
    completed: true,
    completedAt: dueAt(-2, 20),
    createdAt: createdAt(-8),
  }),
  task({
    id: 'seed-9',
    title: '提交大创中期检查材料',
    categoryId: 'project',
    priority: 'P2',
    dueAt: dueAt(7, 17),
    completed: false,
    createdAt: createdAt(-9),
  }),
]

export const SEED_TOMORROW_PLAN =
  '上午把 ER 图改到第三版，下午跑通调度实验的数据；晚上留一小时复习数据结构树部分。'
