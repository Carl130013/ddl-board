import { PenLine } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface TomorrowPlanProps {
  value: string
  onChange: (value: string) => void
}

/**
 * 明日计划：一句话就够了。
 * 输入即写入本地状态（M1 接入 localStorage 持久化），不加保存按钮。
 */
export function TomorrowPlan({ value, onChange }: TomorrowPlanProps) {
  const length = value.trim().length

  return (
    <section className="surface-card flex flex-col overflow-hidden">
      <header className="flex h-9 items-center justify-between border-b border-hairline-soft px-3.5">
        <span className="eyebrow flex items-center gap-1.5">
          <PenLine className="size-3" />
          明日计划
        </span>
        <span className="num text-[10px] tracking-[0.08em] text-ink-faint">NEXT</span>
      </header>

      <div className="px-2.5 py-2">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="明天要先啃哪块硬骨头？写一句话就够了。"
          className={cn(
            'min-h-[70px] resize-none border-0 bg-transparent px-1.5 py-1 text-[12.5px] leading-relaxed text-ink shadow-none',
            'placeholder:text-ink-ghost focus-visible:border-0 focus-visible:ring-0',
          )}
        />
      </div>

      <footer className="flex items-center justify-between border-t border-hairline-soft px-3.5 py-1.5">
        <span className="text-[10px] text-ink-faint">自动保存在本机</span>
        <span className="num text-[10px] text-ink-faint">{length} 字</span>
      </footer>
    </section>
  )
}