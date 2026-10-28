import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatNumericMonthDay, formatClock } from '@/lib/date'
import type { ImportResult } from '@/lib/backup'

interface ImportDialogProps {
  open: boolean
  fileName: string | null
  result: ImportResult | null
  onCancel: () => void
  onConfirm: (mode: 'merge' | 'replace') => void
}

/**
 * 导入确认。
 * 不静默合并 —— 先让用户看清"这份文件里有什么"，再决定合并还是覆盖。
 */
export function ImportDialog({ open, fileName, result, onCancel, onConfirm }: ImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogContent className="max-w-[420px] gap-0 rounded-2xl border-hairline p-0 shadow-pop">
        <DialogHeader className="border-b border-hairline-soft px-5 py-3.5">
          <DialogTitle className="text-[14px] font-semibold text-ink">导入备份</DialogTitle>
          <DialogDescription className="text-[11.5px] text-ink-soft">
            文件已解析完成，选择导入方式。
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4">
          <div className="rounded-xl border border-hairline bg-subtle px-3 py-2.5">
            <p className="num truncate text-[11px] text-ink-soft" title={fileName ?? ''}>
              {fileName ?? '未知文件'}
            </p>
            <div className="mt-1.5 flex items-baseline gap-3">
              <span className="text-[12px] text-ink">
                共 <span className="num font-medium">{result?.valid ?? 0}</span> 条任务
              </span>
              {result && result.invalid > 0 && (
                <span className="num text-[10.5px] text-warn">
                  跳过 {result.invalid} 条无法识别
                </span>
              )}
              {result?.exportedAt && (
                <span className="num ml-auto text-[10px] text-ink-faint">
                  导出于 {formatNumericMonthDay(new Date(result.exportedAt))} {formatClock(result.exportedAt)}
                </span>
              )}
            </div>
          </div>

          <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-ink-soft">
            <li>
              <span className="text-ink">合并导入</span> · 保留现有任务，按 id 合并；同一任务取更新时间较新的版本。
            </li>
            <li>
              <span className="text-ink">覆盖导入</span> · 清空当前全部任务，完全按文件恢复
              {result?.hasUiState ? '（含筛选、排序、明日计划）' : ''}。
            </li>
          </ul>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-hairline-soft px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 rounded-lg px-2.5 text-[12px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
          >
            取消
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onConfirm('replace')}
              className="h-8 rounded-lg border border-danger-line bg-card px-3 text-[12px] text-danger transition-colors hover:bg-danger-soft"
            >
              覆盖导入
            </button>
            <button
              type="button"
              onClick={() => onConfirm('merge')}
              className="h-8 rounded-lg bg-brand px-3 text-[12px] font-medium text-white transition-colors hover:bg-brand-hover"
            >
              合并导入
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}