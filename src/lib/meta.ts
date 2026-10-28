import type { CSSProperties } from 'react'

import type { CategoryId, Priority } from '@/types/task'

/**
 * 标签配色：全部走 CSS 变量，浅色 / 深色两套在 index.css 里定义。
 * 组件只认语义，不认具体色值。
 */

export interface Tone {
  /** 文字色 */
  fg: string
  /** 底色 */
  bg: string
  /** 描边 */
  border: string
}

export interface PriorityMeta extends Tone {
  label: string
  /** 中文语义，用于筛选器与提示 */
  hint: string
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  P0: {
    label: 'P0',
    hint: '紧急',
    fg: 'var(--tag-p0-fg)',
    bg: 'var(--tag-p0-bg)',
    border: 'var(--tag-p0-border)',
  },
  P1: {
    label: 'P1',
    hint: '重要',
    fg: 'var(--tag-p1-fg)',
    bg: 'var(--tag-p1-bg)',
    border: 'var(--tag-p1-border)',
  },
  P2: {
    label: 'P2',
    hint: '常规',
    fg: 'var(--tag-p2-fg)',
    bg: 'var(--tag-p2-bg)',
    border: 'var(--tag-p2-border)',
  },
}

export const PRIORITY_ORDER: Priority[] = ['P0', 'P1', 'P2']

export interface CategoryMeta extends Tone {
  label: string
}

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  homework: {
    label: '作业',
    fg: 'var(--tag-homework-fg)',
    bg: 'var(--tag-homework-bg)',
    border: 'var(--tag-homework-border)',
  },
  exam: {
    label: '考试',
    fg: 'var(--tag-exam-fg)',
    bg: 'var(--tag-exam-bg)',
    border: 'var(--tag-exam-border)',
  },
  project: {
    label: '项目',
    fg: 'var(--tag-project-fg)',
    bg: 'var(--tag-project-bg)',
    border: 'var(--tag-project-border)',
  },
  reading: {
    label: '阅读',
    fg: 'var(--tag-reading-fg)',
    bg: 'var(--tag-reading-bg)',
    border: 'var(--tag-reading-border)',
  },
  other: {
    label: '其他',
    fg: 'var(--tag-other-fg)',
    bg: 'var(--tag-other-bg)',
    border: 'var(--tag-other-border)',
  },
}

export const CATEGORY_IDS = Object.keys(CATEGORY_META) as CategoryId[]

/** 标签通用样式：浅底 + 深字 + 同色系描边（变量自动随主题切换） */
export function tagStyle(tone: Tone): CSSProperties {
  return {
    color: tone.fg,
    backgroundColor: tone.bg,
    borderColor: tone.border,
  }
}

/** 用于圆点、进度条等只需要一个实色的地方 */
export function dotColor(tone: Tone): string {
  return tone.fg
}