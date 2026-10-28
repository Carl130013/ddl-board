import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import { DateRail } from '@/components/calendar/date-rail'
import { FocusRing } from '@/components/dashboard/focus-ring'
import { TomorrowPlan } from '@/components/dashboard/tomorrow-plan'
import { WeekOverview } from '@/components/dashboard/week-overview'
import { TopBar } from '@/components/layout/top-bar'
import { BatchBar, BatchFloatingBar } from '@/components/tasks/batch-bar'
import { QuickAdd } from '@/components/tasks/quick-add'
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel'
import { TaskList } from '@/components/tasks/task-list'
import { TaskToolbar } from '@/components/tasks/task-toolbar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTaskStore } from '@/hooks/use-task-store'
import { useTheme } from '@/hooks/use-theme'
import { downloadBackup, parseBackup, type ImportResult } from '@/lib/backup'
import { boardFileName, buildBoardHtml } from '@/lib/html-export'
import { buildTasksCsv } from '@/lib/csv'
import { formatMonthDay, toDateKey } from '@/lib/date'
import { downloadText, timestampedName } from '@/lib/download'
import { describeParsed, type ParsedTaskInput } from '@/lib/parse-task'
import { filterTasks, isDueOn, sortTasks, withDerived } from '@/lib/task'
import type { PersistedState, Task } from '@/types/task'

// 弹窗很少用到，按需加载，减小首屏包体
const ImportDialog = lazy(() =>
  import('@/components/tasks/import-dialog').then((module) => ({ default: module.ImportDialog })),
)
const ConfirmDialog = lazy(() =>
  import('@/components/ui/confirm-dialog').then((module) => ({ default: module.ConfirmDialog })),
)

const UNDO_DURATION = 6000

/**
 * 布局：3 / 6 / 3。
 * M3：CSV 导出 + 批量管理（全选 / 批量删除 / 二次确认 / 撤销）。
 */
export default function App() {
  const {
    tasks,
    tomorrowPlan,
    selectedDate,
    status,
    sortKey,
    addTask,
    restoreTask,
    toggleTask,
    updateTask,
    deleteTask,
    deleteTasks,
    restoreTasks,
    setTaskOrder,
    applyImport,
    setTomorrowPlan,
    setSelectedDate,
    setStatus,
    setSortKey,
  } = useTaskStore()

  const { theme, toggleTheme } = useTheme()
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<{ fileName: string; result: ImportResult } | null>(null)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false)
  const [query, setQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const quickAddRef = useRef<HTMLInputElement | null>(null)

  const derived = useMemo(() => withDerived(tasks), [tasks])
  const openTask = useMemo(
    () => derived.find((task) => task.id === openTaskId) ?? null,
    [derived, openTaskId],
  )

  const visibleTasks = useMemo(() => {
    const byDate =
      selectedDate === 'all' ? derived : derived.filter((task) => isDueOn(task, selectedDate))

    const filtered = filterTasks(byDate, {
      status,
      categoryId: 'all',
      priority: 'all',
    })

    const keyword = query.trim().toLowerCase()
    const matched = keyword
      ? filtered.filter((task) => task.title.toLowerCase().includes(keyword))
      : filtered

    return sortTasks(matched, sortKey)
  }, [derived, selectedDate, status, sortKey, query])

  // 任务被删/被导入后，清理已经不存在的选中项
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev
      const alive = new Set(tasks.map((task) => task.id))
      const next = new Set([...prev].filter((id) => alive.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [tasks])

  // 全局快捷键：/ 搜索、N 新建、Esc 逐层退出
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const editing =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if (event.key === 'Escape') {
        // 弹窗自己会处理 Esc，别抢
        if (document.querySelector('[role="dialog"]')) return
        if (openTaskId) {
          setOpenTaskId(null)
          return
        }
        if (searchRef.current && document.activeElement === searchRef.current) {
          setQuery('')
          searchRef.current.blur()
          return
        }
        if (query) {
          setQuery('')
          return
        }
        return
      }

      if (editing) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (document.querySelector('[role="dialog"]')) return

      if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }

      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault()
        quickAddRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openTaskId, query])

  const handleAdd = useCallback(
    (parsed: ParsedTaskInput) => {
      const task = addTask(parsed)

      const dueKey = toDateKey(new Date(parsed.dueAt))
      if (selectedDate !== 'all' && selectedDate !== dueKey) setSelectedDate('all')

      const hint = parsed.hasDate
        ? describeParsed(parsed)
        : selectedDate === 'all'
          ? `${describeParsed(parsed)} · 未识别日期，已按今天放入`
          : `${describeParsed(parsed)} · 已加到选中的 ${formatMonthDay(new Date(parsed.dueAt))}`

      toast.success(`已添加「${task.title}」`, {
        description: hint,
        duration: UNDO_DURATION,
        action: { label: '撤销', onClick: () => deleteTask(task.id) },
      })
    },
    [addTask, deleteTask, selectedDate, setSelectedDate],
  )

  const handleDelete = useCallback(
    (id: string) => {
      const target = tasks.find((task) => task.id === id)
      deleteTask(id)
      if (openTaskId === id) setOpenTaskId(null)
      if (!target) return
      toast('已删除', {
        description: target.title,
        duration: UNDO_DURATION,
        action: { label: '撤销', onClick: () => restoreTask(target) },
      })
    },
    [deleteTask, openTaskId, restoreTask, tasks],
  )

  const handleRename = useCallback(
    (id: string, title: string) => {
      updateTask(id, { title })
    },
    [updateTask],
  )

  const handlePatch = useCallback(
    (id: string, patch: Partial<Pick<Task, 'title' | 'notes' | 'dueAt' | 'allDay' | 'priority' | 'categoryId'>>) => {
      updateTask(id, patch)
    },
    [updateTask],
  )

  // ── 导出 ─────────────────────────────────────────────────
  const handleExportBackup = useCallback(() => {
    const snapshot: PersistedState = {
      version: 1,
      tasks,
      tomorrowPlan,
      selectedDate,
      status,
      sortKey,
      updatedAt: new Date().toISOString(),
    }
    try {
      const name = downloadBackup(snapshot)
      toast.success('备份已导出', { description: `${tasks.length} 条任务 · ${name}` })
    } catch {
      toast.error('导出失败', { description: '浏览器阻止了文件下载，请检查下载权限。' })
    }
  }, [tasks, tomorrowPlan, selectedDate, status, sortKey])

  const handleExportHtml = useCallback(() => {
    if (tasks.length === 0) {
      toast('没有可导出的任务', { description: '先添加几条任务再试。' })
      return
    }
    try {
      const name = boardFileName()
      downloadText(buildBoardHtml(tasks), name, 'text/html;charset=utf-8')
      toast.success('看板已导出', {
        description: `${tasks.length} 条任务 · ${name} · 双击即可在浏览器打开`,
      })
    } catch {
      toast.error('导出失败', { description: '浏览器阻止了文件下载，请检查下载权限。' })
    }
  }, [tasks])

  const handleExportCsv = useCallback(() => {
    if (tasks.length === 0) {
      toast('没有可导出的任务', { description: '先添加几条任务再试。' })
      return
    }
    try {
      const name = timestampedName('ddl-tasks', 'csv')
      downloadText(buildTasksCsv(tasks), name, 'text/csv;charset=utf-8')
      toast.success('表格已导出', {
        description: `${tasks.length} 条任务 · ${name} · 可用 WPS / Excel 打开`,
      })
    } catch {
      toast.error('导出失败', { description: '浏览器阻止了文件下载，请检查下载权限。' })
    }
  }, [tasks])

  // ── 导入 ─────────────────────────────────────────────────
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      const parsed = parseBackup(text)
      if (!parsed.ok) {
        toast.error('导入失败', { description: parsed.error })
        return
      }
      setPendingImport({ fileName: file.name, result: parsed.result })
    } catch {
      toast.error('导入失败', { description: '文件读取异常，请重试。' })
    }
  }, [])

  const handleConfirmImport = useCallback(
    (mode: 'merge' | 'replace') => {
      if (!pendingImport) return
      const { result } = pendingImport

      const ui =
        mode === 'replace'
          ? {
              selectedDate: result.state.selectedDate,
              status: result.state.status,
              sortKey: result.state.sortKey,
              tomorrowPlan: result.state.tomorrowPlan,
            }
          : undefined

      const outcome = applyImport(result.state.tasks, mode, ui)

      setPendingImport(null)
      setOpenTaskId(null)
      setSelectedIds(new Set())
      setSelectedDate(mode === 'replace' ? result.state.selectedDate : selectedDate)

      toast.success(mode === 'replace' ? '已覆盖导入' : '已合并导入', {
        description: `新增 ${outcome.added} · 更新 ${outcome.updated} · 跳过 ${outcome.skipped}`,
      })
    },
    [applyImport, pendingImport, selectedDate, setSelectedDate],
  )

  // ── 批量管理 ─────────────────────────────────────────────
  const handleToggleBatch = useCallback(() => {
    const next = !batchMode
    setBatchMode(next)
    if (!next) setSelectedIds(new Set())
    setOpenTaskId(null)
  }, [batchMode])

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectedInView = visibleTasks.filter((task) => selectedIds.has(task.id))
  const allSelected = visibleTasks.length > 0 && selectedInView.length === visibleTasks.length

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const visibleIds = visibleTasks.map((task) => task.id)
      const everySelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))
      if (everySelected) return new Set()
      return new Set([...prev, ...visibleIds])
    })
  }, [visibleTasks])

  const handleBulkDelete = useCallback(() => {
    const targets = tasks.filter((task) => selectedIds.has(task.id))
    if (targets.length === 0) return

    deleteTasks(targets.map((task) => task.id))
    setConfirmBulkOpen(false)
    setSelectedIds(new Set())

    toast(`已删除 ${targets.length} 个任务`, {
      description: '如需找回，可点击右侧撤销。',
      duration: UNDO_DURATION,
      action: { label: '撤销', onClick: () => restoreTasks(targets) },
    })
  }, [deleteTasks, restoreTasks, selectedIds, tasks])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen flex-col bg-background text-ink">
        <TopBar
          onExportHtml={handleExportHtml}
          onExportBackup={handleExportBackup}
          onExportCsv={handleExportCsv}
          onImport={handleImportClick}
          taskCount={tasks.length}
          search={query}
          onSearchChange={setQuery}
          searchInputRef={searchRef}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="mx-auto grid w-full max-w-[1480px] flex-1 grid-cols-12 gap-5 px-6 pt-5 pb-10">
          <div className="col-span-12 flex flex-col gap-5 self-start xl:sticky xl:top-[104px] xl:col-span-3">
            <DateRail tasks={derived} selectedDate={selectedDate} onSelect={setSelectedDate} />
            <WeekOverview tasks={derived} />
          </div>

          <div className="col-span-12 xl:col-span-6">
            <QuickAdd onAdd={handleAdd} defaultDateKey={selectedDate} inputRef={quickAddRef} />

            <TaskToolbar
              status={status}
              onStatusChange={setStatus}
              sortKey={sortKey}
              onSortChange={setSortKey}
              count={visibleTasks.length}
              batchMode={batchMode}
              onToggleBatch={handleToggleBatch}
            />

            {batchMode && (
              <BatchBar
                total={visibleTasks.length}
                selectedCount={selectedInView.length}
                allSelected={allSelected}
                onToggleAll={handleToggleAll}
                onExit={handleToggleBatch}
              />
            )}

            <TaskList
              tasks={visibleTasks}
              selectedDate={selectedDate}
              sortKey={sortKey}
              onToggle={toggleTask}
              onDelete={handleDelete}
              onRename={handleRename}
              onOpen={setOpenTaskId}
              onReorder={setTaskOrder}
              query={query}
              selectionMode={batchMode}
              selectedIds={selectedIds}
              onSelect={handleSelect}
            />
          </div>

          <div className="col-span-12 flex flex-col gap-5 self-start xl:sticky xl:top-[104px] xl:col-span-3">
            <FocusRing tasks={derived} />
            <TomorrowPlan value={tomorrowPlan} onChange={setTomorrowPlan} />
          </div>
        </main>

        <footer className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-6 pb-7">
          <span className="flex items-center gap-1.5 text-[10.5px] text-ink-faint">
            <span className="size-1.5 rounded-full bg-mint" />
            所有数据保存在本机浏览器 · 建议定期「导出」备份
          </span>
          <span className="num text-[10px] tracking-[0.06em] text-ink-ghost">
            DDL Workbench · v0.5
          </span>
        </footer>

        <TaskDetailPanel
          task={openTask}
          onClose={() => setOpenTaskId(null)}
          onPatch={handlePatch}
          onDelete={handleDelete}
          onToggle={toggleTask}
        />

        <Suspense fallback={null}>
          {pendingImport && (
            <ImportDialog
              open
              fileName={pendingImport.fileName}
              result={pendingImport.result}
              onCancel={() => setPendingImport(null)}
              onConfirm={handleConfirmImport}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {confirmBulkOpen && (
            <ConfirmDialog
              open
              title={`确定要删除这 ${selectedInView.length} 个任务吗？`}
              description="删除后会立刻从本机数据中移除；右下角提示条提供 6 秒撤销窗口。"
              confirmLabel={`删除 ${selectedInView.length} 项`}
              onConfirm={handleBulkDelete}
              onCancel={() => setConfirmBulkOpen(false)}
            />
          )}
        </Suspense>

        <AnimatePresence>
          {batchMode && selectedInView.length > 0 && (
            <BatchFloatingBar
              key="batch-floating"
              count={selectedInView.length}
              onDelete={() => setConfirmBulkOpen(true)}
              onClear={() => setSelectedIds(new Set())}
            />
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          data-testid="import-input"
          onChange={handleFileChange}
        />

        <Toaster theme={theme} />
      </div>
    </TooltipProvider>
  )
}