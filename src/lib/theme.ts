export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ddl-workbench.theme'

const BACKGROUND: Record<Theme, string> = {
  light: '#F4F6F8',
  dark: '#0A0A0A',
}

export function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

export function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* 隐私模式下静默失败 */
  }
}

/**
 * 把主题写到 <html> 上。
 * animate=true 时临时开启全局颜色过渡（约 320ms），避免初始渲染时也"渐变"。
 */
export function applyTheme(theme: Theme, options: { animate?: boolean } = {}): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  if (options.animate) {
    root.classList.add('theme-switching')
    window.setTimeout(() => root.classList.remove('theme-switching'), 320)
  }

  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', BACKGROUND[theme])
}