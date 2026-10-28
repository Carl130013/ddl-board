import { countdownLabel, formatClock } from '@/lib/date'
import { CATEGORY_META, PRIORITY_META } from '@/lib/meta'
import type { Task } from '@/types/task'

/** 我的任务看板-20261028.html */
export function boardFileName(date: Date = new Date()): string {
  return `我的任务看板-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}.html`
}

const pad = (value: number) => `${value}`.padStart(2, '0')

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function daysLeft(task: Task): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(task.dueAt)
  due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

/**
 * 生成一份可离线双击打开的 HTML 看板。
 * 单文件、内嵌样式、不引用任何外链资源 —— 发给同学 / 打印 / 存档都成立。
 */
export function buildBoardHtml(tasks: Task[], now: Date = new Date()): string {
  const sorted = [...tasks].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
  const done = sorted.filter((task) => task.completed).length

  const rows = sorted
    .map((task) => {
      const category = CATEGORY_META[task.categoryId]
      const priority = PRIORITY_META[task.priority]
      const due = new Date(task.dueAt)
      const left = daysLeft(task)
      const dueMain = task.allDay ? `${formatDay(due)} · 全天` : `${formatDay(due)} ${formatClock(task.dueAt)}`
      const dueSub = task.completed ? '已完成' : countdownLabel(left)

      return `      <tr class="${task.completed ? 'is-done' : ''}">
        <td class="title">${escapeHtml(task.title)}</td>
        <td class="due"><span class="num">${escapeHtml(dueMain)}</span><span class="sub">${escapeHtml(dueSub)}</span></td>
        <td><span class="tag" style="color:${priority.fg};background:${priority.bg};border-color:${priority.border}">${priority.label}</span></td>
        <td><span class="tag" style="color:${category.fg};background:${category.bg};border-color:${category.border}">${category.label}</span></td>
        <td class="status">${task.completed ? '已完成' : '进行中'}</td>
      </tr>`
    })
    .join('\n')

  const generated = `${formatDay(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}`

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>我的任务看板 · ${formatDay(now)}</title>
<style>
  :root {
    --ink: #1f2937;
    --soft: #6b7280;
    --faint: #9ca3af;
    --line: #e5e7eb;
    --hairline: #f1f3f5;
    --bg: #f4f6f8;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 40px 24px;
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
  }
  .board {
    max-width: 880px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(17, 24, 39, 0.03);
    overflow: hidden;
  }
  header { padding: 22px 26px 18px; border-bottom: 1px solid var(--hairline); }
  h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; }
  .meta { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: var(--soft); }
  .meta b { font-weight: 500; color: var(--ink); }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    padding: 9px 16px;
    text-align: left;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--faint);
    background: #fcfdfe;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  tbody td {
    padding: 11px 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--hairline);
    vertical-align: middle;
  }
  tbody tr:last-child td { border-bottom: none; }
  .title { color: var(--ink); }
  .due { color: var(--soft); white-space: nowrap; }
  .sub { display: block; margin-top: 1px; font-size: 10.5px; color: var(--faint); }
  .status { color: var(--soft); font-size: 12px; white-space: nowrap; }
  .num {
    font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, monospace;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em;
  }
  .tag {
    display: inline-block;
    padding: 1px 7px;
    border: 1px solid;
    border-radius: 5px;
    font-size: 10.5px;
    font-weight: 500;
    white-space: nowrap;
  }
  tr.is-done .title { color: var(--faint); text-decoration: line-through; text-decoration-color: #c6cdd5; }
  tr.is-done .due, tr.is-done .status { color: var(--faint); }
  footer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 26px;
    border-top: 1px solid var(--hairline);
    font-size: 10.5px;
    color: var(--faint);
  }
  @media (max-width: 620px) {
    body { padding: 16px 12px; }
    .status, thead th:last-child { display: none; }
    tbody td, thead th { padding: 10px 12px; }
  }
  @media print {
    body { padding: 0; background: #fff; }
    .board { border: none; border-radius: 0; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="board">
    <header>
      <h1>我的任务看板</h1>
      <div class="meta">
        <span>共 <b>${sorted.length}</b> 条</span>
        <span>已完成 <b>${done}</b></span>
        <span>待办 <b>${sorted.length - done}</b></span>
        <span style="margin-left:auto" class="num">生成于 ${generated}</span>
      </div>
    </header>
    <table>
      <thead>
        <tr><th>任务名称</th><th>截止时间</th><th>优先级</th><th>分类</th><th>状态</th></tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <footer>
      <span>由 DDL 工作台导出 · 单文件，可直接分享</span>
      <span>${formatDay(now)}</span>
    </footer>
  </div>
</body>
</html>
`
}