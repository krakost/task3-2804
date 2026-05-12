import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useVeniceBreakdownImport } from '@/hooks/useVeniceBreakdownImport'
import { cn } from '@/lib/utils'
import type { BoardColumnSummary } from '@/types'

type BoardAiBreakdownPanelProps = {
  boardId: string
  columns: BoardColumnSummary[]
  columnsLoading?: boolean
}

export function BoardAiBreakdownPanel({
  boardId,
  columns,
  columnsLoading = false,
}: BoardAiBreakdownPanelProps) {
  const { t } = useTranslation()
  const importBreakdown = useVeniceBreakdownImport()
  const [taskText, setTaskText] = useState('')
  const [columnId, setColumnId] = useState(() => columns[0]?.id ?? '')
  const [lastTitles, setLastTitles] = useState<string[]>([])

  useEffect(() => {
    setColumnId((prev) => {
      if (columns.some((c) => c.id === prev)) return prev
      return columns[0]?.id ?? ''
    })
  }, [columns])

  function resolveErrorMessage(): string | null {
    const err = importBreakdown.error
    if (!err) return null
    if (err instanceof Error && err.message === 'NO_ITEMS') {
      return t('kanban.aiBreakdown.emptyItems')
    }
    return err instanceof Error ? err.message : String(err)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = taskText.trim()
    if (!text || !columnId) return
    setLastTitles([])
    try {
      const result = await importBreakdown.mutateAsync({
        boardId,
        columnId,
        taskText: text,
      })
      setLastTitles(result.titles)
      setTaskText('')
    } catch {
      // ошибка уже в importBreakdown.error
    }
  }

  const noColumns = columns.length === 0
  const busy = importBreakdown.isPending || columnsLoading
  const errorText = resolveErrorMessage()

  return (
    <section
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      aria-label={t('kanban.aiBreakdown.title')}
    >
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        {t('kanban.aiBreakdown.title')}
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {t('kanban.aiBreakdown.hint')}
      </p>

      {columns.length === 0 && columnsLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : noColumns ? (
        <p className="text-sm text-muted-foreground">
          {t('kanban.aiBreakdown.noColumns')}
        </p>
      ) : (
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="ai-breakdown-column">
              {t('kanban.aiBreakdown.columnLabel')}
            </Label>
            <select
              id="ai-breakdown-column"
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              disabled={busy || columns.length === 0}
              className="h-9 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-breakdown-task">
              {t('kanban.aiBreakdown.taskLabel')}
            </Label>
            <textarea
              id="ai-breakdown-task"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder={t('kanban.aiBreakdown.placeholder')}
              rows={3}
              disabled={busy}
              className={cn(
                'w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30',
              )}
            />
          </div>

          {errorText ? (
            <p className="text-sm text-destructive" role="alert">
              {errorText}
            </p>
          ) : null}

          {lastTitles.length > 0 && !importBreakdown.isPending ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium text-foreground">
                {t('kanban.aiBreakdown.success', { count: lastTitles.length })}
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                {lastTitles.map((title, idx) => (
                  <li key={`${idx}:${title}`}>{title}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button
            type="submit"
            size="sm"
            disabled={busy || !taskText.trim() || !columnId}
          >
            {busy ? t('kanban.aiBreakdown.submitting') : t('kanban.aiBreakdown.submit')}
          </Button>
        </form>
      )}
    </section>
  )
}
