import { Download, FileSpreadsheet, LayoutList, Moon, RefreshCw, Search, Sun, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { formatHeaderDate, formatMonthDay, greetingFor } from '@/lib/date'
import type { Theme } from '@/lib/theme'

interface TopBarProps {
  onExportHtml: () => void
  onExportBackup: () => void
  onExportCsv: () => void
  onImport: () => void
  taskCount: number
  search: string
  onSearchChange: (value: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  theme: Theme
  onToggleTheme: () => void
}

/**
 * 顶栏：日期、搜索、数据出入口。
 * 搜索框支持 "/" 聚焦、"Esc" 清空失焦（快捷键逻辑在 App 里统一处理）。
 */
export function TopBar({
  onExportHtml,
  onExportBackup,
  onExportCsv,
  onImport,
  taskCount,
  search,
  onSearchChange,
  searchInputRef,
  theme,
  onToggleTheme,
}: TopBarProps) {
  const now = new Date()
  const date = formatHeaderDate(now)

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[84px] max-w-[1480px] items-center justify-between gap-5 px-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="truncate text-[11.5px] tracking-[0.02em] text-ink-faint">
            {greetingFor(now)} · 今天也要把 DDL 清空
          </span>

          <div className="flex items-baseline gap-2.5">
            <h1 className="num text-[26px] leading-none font-semibold tracking-[-0.02em] text-ink">
              {formatMonthDay(now)}
            </h1>
            <span className="text-[14px] leading-none font-medium text-ink-soft">
              {date.weekday}
            </span>
            <span className="num text-[10.5px] leading-none tracking-[0.06em] text-ink-ghost">
              {date.year}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-ghost" />

            <input
              ref={searchInputRef}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索任务"
              aria-label="搜索任务"
              data-testid="search-input"
              className="h-8 w-[150px] rounded-lg border border-hairline bg-card/70 pr-7 pl-8 text-[12px] text-ink transition-all outline-none placeholder:text-ink-ghost hover:border-hairline-strong focus:w-[220px] focus:border-brand-line focus:bg-card focus:ring-2 focus:ring-brand/10 xl:w-[190px]"
            />

            {search ? (
              <button
                type="button"
                aria-label="清空搜索"
                onClick={() => {
                  onSearchChange('')
                  searchInputRef.current?.focus()
                }}
                className="absolute top-1/2 right-1.5 flex size-4.5 -translate-y-1/2 items-center justify-center rounded text-ink-faint transition-colors hover:text-ink"
              >
                <X className="size-3" />
              </button>
            ) : (
              <kbd className="num pointer-events-none absolute top-1/2 right-1.5 hidden -translate-y-1/2 items-center rounded border border-hairline bg-subtle px-1 text-[9.5px] text-ink-faint sm:flex">
                /
              </kbd>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-mint-line bg-mint-soft px-2 py-[3px] text-[10px] tracking-[0.06em] text-mint-ink uppercase lg:inline-flex">
              <span className="size-1.5 rounded-full bg-mint" />
              {taskCount} 条 · local
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="text-ink-soft hover:bg-card hover:text-ink"
              title="同步（待接入）"
              onClick={() =>
                toast('同步功能待接入', { description: '本地备份请用「导出 / 导入」。' })
              }
            >
              <RefreshCw />
              同步
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-strong hover:bg-card hover:text-brand-strong"
              title="导出单文件 HTML 看板，双击即可在浏览器打开"
              onClick={onExportHtml}
            >
              <LayoutList />
              导出看板
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-ink-soft hover:bg-card hover:text-ink"
              title="导出 CSV，可用 WPS / Excel 打开"
              onClick={onExportCsv}
            >
              <FileSpreadsheet />
              导出表格
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-ink-soft hover:bg-card hover:text-ink"
              title="导出 JSON 完整备份"
              onClick={onExportBackup}
            >
              <Download />
              备份
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-ink-soft hover:bg-card hover:text-ink"
              title="从 JSON 备份恢复"
              onClick={onImport}
            >
              <Upload />
              导入
            </Button>

            <span className="mx-1 h-4 w-px bg-hairline" aria-hidden />

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              className="flex size-8 items-center justify-center rounded-lg border border-hairline bg-card text-ink-soft transition-all duration-200 hover:rotate-12 hover:border-hairline-strong hover:text-ink"
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}