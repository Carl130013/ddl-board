/** 触发一次浏览器下载（Blob + 临时 <a>），不依赖任何库 */
export function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** ddl-tasks-20261028-2317.csv / ddl-backup-20261028-2317.json */
export function timestampedName(prefix: string, extension: string, date: Date = new Date()): string {
  const pad = (value: number) => `${value}`.padStart(2, '0')
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}`
  return `${prefix}-${stamp}.${extension}`
}