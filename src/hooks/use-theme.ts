import { useCallback, useEffect, useRef, useState } from 'react'

import { applyTheme, readStoredTheme, saveTheme, type Theme } from '@/lib/theme'

/**
 * 主题状态：默认浅色，用户切换后写入 localStorage。
 * 首次应用不加过渡，之后每次切换都走 320ms 的全局颜色过渡。
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? 'light')
  const isFirstApply = useRef(true)

  useEffect(() => {
    applyTheme(theme, { animate: !isFirstApply.current })
    saveTheme(theme)
    isFirstApply.current = false
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}