import type { ReactNode } from 'react'

import { tagStyle, type Tone } from '@/lib/meta'
import { cn } from '@/lib/utils'

interface TagProps {
  /** 取 CATEGORY_META / PRIORITY_META 中的一项 */
  tone: Tone
  children: ReactNode
  className?: string
}

/**
 * 标签的唯一实现：浅莫兰迪底 + 深色字 + 同色系描边，圆角。
 * 禁止在别处堆 bg-red-500 这类高饱和色块。
 */
export function Tag({ tone, children, className }: TagProps) {
  return (
    <span
      style={tagStyle(tone)}
      className={cn(
        'inline-flex h-[18px] shrink-0 items-center rounded-[5px] border px-1.5 text-[10.5px] leading-none font-medium tracking-wide',
        className,
      )}
    >
      {children}
    </span>
  )
}