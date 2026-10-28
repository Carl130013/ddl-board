import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** 通用二次确认框：危险操作统一走这里，避免各处自己拼 Dialog */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = '取消',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel() }}>
      <DialogContent className="max-w-[380px] gap-0 rounded-2xl border-hairline p-0 shadow-pop">
        <DialogHeader className="px-5 pt-4 pb-0">
          <DialogTitle className="text-[14px] font-semibold text-ink">{title}</DialogTitle>
          {description && (
            <DialogDescription className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="flex items-center justify-end gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 rounded-lg px-3 text-[12px] text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-8 rounded-lg bg-danger px-3 text-[12px] font-medium text-white transition-colors hover:bg-danger-hover"
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}