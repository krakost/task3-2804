import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateBoardColumn,
  useDeleteBoardColumn,
  useUpdateBoardColumn,
} from '@/hooks/useBoardColumns'
import type { BoardColumnSummary } from '@/types'

function hexForColorInput(hex: string): string {
  const t = hex.trim()
  if (/^#[0-9a-fA-F]{6}$/i.test(t)) return t.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/i.test(t)) {
    const [, r, g, b] = t
    if (r == null || g == null || b == null) return '#71717a'
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return '#71717a'
}

export const COLUMN_COLOR_PRESETS = [
  '#71717a',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
] as const

const DEFAULT_COLUMN_COLOR: string = COLUMN_COLOR_PRESETS[0]

export type ColumnFormMode = 'create' | 'edit'

export type ColumnFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ColumnFormMode
  boardId: string | null
  column: BoardColumnSummary | null
}

export function ColumnFormDialog({
  open,
  onOpenChange,
  mode,
  boardId,
  column,
}: ColumnFormDialogProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(DEFAULT_COLUMN_COLOR)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const createCol = useCreateBoardColumn()
  const updateCol = useUpdateBoardColumn()
  const deleteCol = useDeleteBoardColumn()

  const busy =
    createCol.isPending || updateCol.isPending || deleteCol.isPending

  useEffect(() => {
    if (!open) return
    setConfirmDeleteOpen(false)
    createCol.reset()
    updateCol.reset()
    deleteCol.reset()
    if (mode === 'edit' && column) {
      setTitle(column.title)
      setColor(column.color)
    } else {
      setTitle('')
      setColor(DEFAULT_COLUMN_COLOR)
    }
    // Зависит только от открытия диалога и данных колонки с бэкенда (примитивы).
    // Объекты мутаций из useMutation нельзя класть в deps — иначе эффект срабатывает
    // на каждом рендере и сбрасывает название при вводе.
  }, [open, mode, column?.id, column?.title, column?.color])

  function handleClose() {
    onOpenChange(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!boardId) return
    if (mode === 'create') {
      try {
        await createCol.mutateAsync({ boardId, title, color })
        handleClose()
      } catch {
        // surfaced via mutation
      }
      return
    }
    if (!column) return
    try {
      await updateCol.mutateAsync({
        columnId: column.id,
        title,
        color,
      })
      handleClose()
    } catch {
      // surfaced via mutation
    }
  }

  const mutationError =
    mode === 'create' ? createCol.error : updateCol.error

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-4 sm:max-w-[22rem]" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {mode === 'create'
                ? t('kanban.columnForm.createTitle')
                : t('kanban.columnForm.editTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {mode === 'create'
                ? t('kanban.columnForm.descCreate')
                : t('kanban.columnForm.descEdit')}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="column-title">{t('common.title')}</Label>
              <Input
                id="column-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('kanban.columnForm.titlePlaceholder')}
                autoComplete="off"
                disabled={busy}
                required
                minLength={1}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium leading-none">
                {t('common.color')}
              </span>
              <div className="flex flex-wrap gap-2">
                {COLUMN_COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    disabled={busy}
                    title={hex}
                    aria-label={t('kanban.columnForm.colorAria', { hex })}
                    onClick={() => setColor(hex)}
                    className="size-8 rounded-md border-2 shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                    style={{
                      backgroundColor: hex,
                      borderColor:
                        color === hex ? 'var(--foreground)' : 'transparent',
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={hexForColorInput(color)}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={busy}
                  className="h-8 w-14 cursor-pointer rounded border border-border bg-background p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('common.customColor')}
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  disabled={busy}
                  className="font-mono text-xs"
                  spellCheck={false}
                />
              </div>
            </div>

            {mutationError ? (
              <p className="text-sm text-destructive" role="alert">
                {mutationError.message}
              </p>
            ) : null}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
              {mode === 'edit' && column ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy}
                  className="w-full sm:mr-auto sm:w-auto"
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  {t('kanban.columnForm.deleteColumnButton')}
                </Button>
              ) : (
                <span className="hidden sm:block sm:flex-1" />
              )}
              <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={handleClose}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={busy || !boardId}>
                  {busy
                    ? t('common.saving')
                    : mode === 'create'
                      ? t('common.create')
                      : t('common.save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="gap-4 sm:max-w-[22rem]" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {t('kanban.columnForm.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('kanban.columnForm.deleteConfirmDescription', {
                title: column?.title ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          {deleteCol.error ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteCol.error.message}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteCol.isPending}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteCol.isPending || !column || !boardId}
              onClick={() => {
                if (!column || !boardId) return
                void deleteCol
                  .mutateAsync({ columnId: column.id, boardId })
                  .then(() => {
                    setConfirmDeleteOpen(false)
                    handleClose()
                  })
              }}
            >
              {deleteCol.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
