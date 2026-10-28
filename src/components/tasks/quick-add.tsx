import { useState } from 'react'
import { Sparkles } from 'lucide-react'

import { fromDateKey } from '@/lib/date'
import { parseTaskInput, type ParsedTaskInput } from '@/lib/parse-task'

interface QuickAddProps {
  onAdd: (parsed: ParsedTaskInput) => void
  /** 左侧选中的日期（'all' 表示没选具体某天） */
  defaultDateKey: string
  /** 供全局快捷键 / N 聚焦 */
  inputRef?: React.RefObject<HTMLInputElement | null>
}

/**
 * 自然语言输入框。
 * 回车 → 本地正则解析 → 交给上层建任务。
 * 若文本里没写日期，默认归属左侧正在选中的那一天；写了「明天」等则按文本走。
 */
export function QuickAdd({ onAdd, defaultDateKey, inputRef }: QuickAddProps) {
  const [value, setValue] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const text = value.trim()
    if (!text) return

    const options =
      defaultDateKey === 'all' ? undefined : { defaultDate: fromDateKey(defaultDateKey) }

    onAdd(parseTaskInput(text, new Date(), options))
    setValue('')
  }

  return (
    <div className="group">
      <form
        onSubmit={handleSubmit}
        className="surface-card flex items-center gap-2.5 px-3 py-1 transition-all duration-200 focus-within:border-brand-line focus-glow hover:border-hairline-strong"
      >
        <Sparkles className="size-[15px] shrink-0 text-ink-ghost transition-colors group-focus-within:text-brand" />

        <input
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={
            defaultDateKey === 'all'
              ? '下周三交高数作业，P0'
              : '写作业（默认加到选中的这天）'
          }
          className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-ghost"
        />

        <kbd className="num hidden h-[19px] shrink-0 items-center rounded-[5px] border border-hairline bg-subtle px-1.5 text-[10px] text-ink-faint sm:flex">
          N
        </kbd>
        <kbd className="num hidden h-[19px] shrink-0 items-center rounded-[5px] border border-hairline bg-subtle px-1.5 text-[10px] text-ink-faint sm:flex">
          ↵
        </kbd>
      </form>

      <p className="mt-1.5 px-1 text-[10.5px] text-ink-faint">
        自然语言输入 · 支持「明天 / 下周三 / 10月30日」+「P0」+「#作业」
      </p>
    </div>
  )
}