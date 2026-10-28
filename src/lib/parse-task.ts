import { addDays, startOfDay, toDateKey, WEEKDAY_LABELS } from '@/lib/date'
import type { CategoryId, Priority } from '@/types/task'

export interface ParsedTaskInput {
  title: string
  dueAt: string
  allDay: boolean
  priority: Priority
  categoryId: CategoryId
  /** 是否显式识别到日期 */
  hasDate: boolean
  /** 是否显式识别到钟点 */
  hasTime: boolean
  /** 是否显式给出优先级 */
  hasPriority: boolean
  /** 识别到的日期原文，用于 toast 回显 */
  dateHint: string | null
  /** 文本里没写日期，用了调用方给的默认日期 */
  usedDefaultDate: boolean
}

export interface ParseOptions {
  /** 没写日期时的默认归属日（通常是左侧时间轴选中的那天） */
  defaultDate?: Date
}

/** 关键词 → 分类（顺序即优先级，先具体后笼统） */
const CATEGORY_KEYWORDS: Array<[RegExp, CategoryId]> = [
  [/(考试|测验|期中|期末|补考|复习|刷题)/, 'exam'],
  [/(作业|习题|练习|实验报告|大作业|课程设计)/, 'homework'],
  [/(项目|评审|组会|汇报|答辩|论文|开题|大创|PPT)/i, 'project'],
  [/(阅读|读书|看书|文献|教材|第.{1,4}章)/, 'reading'],
]

const LABEL_TO_CATEGORY: Record<string, CategoryId> = {
  作业: 'homework',
  考试: 'exam',
  项目: 'project',
  阅读: 'reading',
  其他: 'other',
}

const CN_DIGITS: Record<string, number> = {
  一: 1,
  两: 2,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

/** 周一为一周起点 */
function startOfWeek(date: Date): Date {
  const day = date.getDay()
  return startOfDay(addDays(date, day === 0 ? -6 : 1 - day))
}

function weekdayIndex(token: string): number {
  if (token === '日' || token === '天') return 7
  const cn = CN_DIGITS[token]
  if (cn) return cn
  return Number(token)
}

/** 本周内即将到来的那一天（含今天） */
function thisWeekday(today: Date, target: number): Date {
  const monday = startOfWeek(today)
  const candidate = addDays(monday, target - 1)
  return candidate < today ? addDays(candidate, 7) : candidate
}

/** 下一周的周几 */
function nextWeekday(today: Date, target: number): Date {
  return addDays(startOfWeek(today), 7 + target - 1)
}

/**
 * 本地正则解析器。
 * 支持：今天/明天/后天/大后天、下周三/周五/周三、10月30日/10-30/3天后、
 * 18:00/下午3点/晚上8点半、P0-P2、#作业/#考试/#项目/#阅读/#其他。
 * 没写日期 → 今天；没写时间 → 23:59（整天型）。
 */
export function parseTaskInput(
  raw: string,
  now: Date = new Date(),
  options: ParseOptions = {},
): ParsedTaskInput {
  const today = startOfDay(now)
  let rest = ` ${raw.replace(/\s+/g, ' ').trim()} `

  // ── 1. 优先级 ────────────────────────────────────────────
  let priority: Priority = 'P2'
  let hasPriority = false
  const priorityMatch = rest.match(/\bP([0-2])\b/i)
  if (priorityMatch) {
    priority = `P${priorityMatch[1]}` as Priority
    hasPriority = true
    rest = rest.replace(priorityMatch[0], ' ')
  }

  // ── 2. #分类 ─────────────────────────────────────────────
  let categoryId: CategoryId | null = null
  const categoryMatch = rest.match(/#(作业|考试|项目|阅读|其他)/)
  if (categoryMatch) {
    categoryId = LABEL_TO_CATEGORY[categoryMatch[1]]
    rest = rest.replace(categoryMatch[0], ' ')
  }

  // ── 3. 钟点 ──────────────────────────────────────────────
  let hour = 23
  let minute = 59
  let hasTime = false

  const colonTime = rest.match(/(\d{1,2})[:：](\d{1,2})/)
  if (colonTime && Number(colonTime[1]) <= 23 && Number(colonTime[2]) <= 59) {
    hour = Number(colonTime[1])
    minute = Number(colonTime[2])
    hasTime = true
    rest = rest.replace(colonTime[0], ' ')
  } else {
    const cnTime = rest.match(/(上午|早上|中午|下午|晚上)?\s*(\d{1,2})\s*点\s*(半|[0-5]?\d\s*分?)?/)
    if (cnTime) {
      const meridiem = cnTime[1]
      let h = Number(cnTime[2])
      if ((meridiem === '下午' || meridiem === '晚上') && h < 12) h += 12
      if (meridiem === '中午' && h < 11) h += 12
      hour = Math.min(h, 23)
      minute = cnTime[3]?.includes('半') ? 30 : cnTime[3] ? Number.parseInt(cnTime[3], 10) : 0
      hasTime = true
      rest = rest.replace(cnTime[0], ' ')
    }
  }

  // ── 4. 日期 ──────────────────────────────────────────────
  let target: Date | null = null
  let dateHint: string | null = null

  const applyDate = (regex: RegExp, resolve: (match: RegExpMatchArray) => Date) => {
    if (target) return
    const match = rest.match(regex)
    if (!match) return
    target = resolve(match)
    dateHint = match[0].trim()
    rest = rest.replace(match[0], ' ')
  }

  applyDate(/大后天/, () => addDays(today, 3))
  applyDate(/后天/, () => addDays(today, 2))
  applyDate(/(今天|今日|今晚|今早)/, () => today)
  applyDate(/(明天|明日|明晚|明早)/, () => addDays(today, 1))

  applyDate(/下(?:个)?(?:周|星期|礼拜)([一二三四五六日天])/, (match) =>
    nextWeekday(today, weekdayIndex(match[1])),
  )
  applyDate(/下(?:个)?(?:周|星期|礼拜)/, () => addDays(startOfWeek(today), 7))

  applyDate(/(?:这|本)?(?:周|星期|礼拜)([一二三四五六日天])/, (match) =>
    thisWeekday(today, weekdayIndex(match[1])),
  )

  applyDate(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?/, (match) => {
    const month = Number(match[1])
    const day = Number(match[2])
    const candidate = new Date(today.getFullYear(), month - 1, day)
    if (candidate < today) candidate.setFullYear(today.getFullYear() + 1)
    return candidate
  })

  applyDate(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})(?!\d)/, (match) => {
    const month = Number(match[1])
    const day = Number(match[2])
    const candidate = new Date(today.getFullYear(), month - 1, day)
    if (candidate < today) candidate.setFullYear(today.getFullYear() + 1)
    return candidate
  })

  applyDate(/(\d+|[一二两三四五六七八九十])\s*天后/, (match) => {
    const token = match[1]
    const amount = /^\d+$/.test(token) ? Number(token) : CN_DIGITS[token]
    return addDays(today, Math.max(amount, 1))
  })

  const fallback = options.defaultDate ? startOfDay(options.defaultDate) : today
  const due = target ?? fallback
  const dueAt = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate(),
    hour,
    minute,
    0,
    0,
  ).toISOString()

  // ── 5. 标题：把识别过的词剔掉，剩下的就是人话 ──────────────
  const title =
    rest
      .replace(/[，,、；;。]+/g, ' ')
      .replace(/\s*之前\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim() || '未命名任务'

  // ── 6. 分类兜底：没写 #标签 就用关键词猜 ───────────────────
  if (!categoryId) {
    const hit = CATEGORY_KEYWORDS.find(([pattern]) => pattern.test(title))
    categoryId = hit ? hit[1] : 'other'
  }

  return {
    title,
    dueAt,
    allDay: !hasTime,
    priority,
    categoryId,
    hasDate: target !== null,
    hasTime,
    hasPriority,
    dateHint,
    usedDefaultDate: target === null,
  }
}

/** 把解析结果变成一句人话，用于 toast 回显 */
export function describeParsed(parsed: ParsedTaskInput): string {
  const due = new Date(parsed.dueAt)
  const day = `${due.getMonth() + 1}月${due.getDate()}日`
  const weekday = WEEKDAY_LABELS[due.getDay()]
  const clock = parsed.hasTime
    ? `${`${due.getHours()}`.padStart(2, '0')}:${`${due.getMinutes()}`.padStart(2, '0')}`
    : '全天'
  return `${day} ${weekday} · ${clock} · ${parsed.priority}`
}

/** 解析结果对应的日期键，用于判断是否需要重置日期筛选 */
export function parsedDateKey(parsed: ParsedTaskInput): string {
  return toDateKey(new Date(parsed.dueAt))
}