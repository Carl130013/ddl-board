import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * 全局提示条：白/暗卡片 + 柔和阴影，跟随主题。
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast !rounded-xl !bg-card !border-hairline !text-ink shadow-float',
          description: '!text-ink-soft !text-[12px]',
          actionButton: '!bg-brand !text-white',
          cancelButton: '!bg-subtle !text-ink-soft',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--ink)',
          '--normal-border': 'var(--hairline)',
          '--border-radius': '12px',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }