import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import { COLUMN_COLOR_PRESETS } from '@/components/kanban/ColumnFormDialog'
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
import { cn } from '@/lib/utils'
import type { BoardMember } from '@/types'

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

const DEFAULT_COLOR: string = COLUMN_COLOR_PRESETS[0]

function buildAssigneeOptions(
  members: BoardMember[],
  t: TFunction,
  editLegacyLabel?: string | null,
): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [
    { value: '', label: t('kanban.taskForm.assigneeNone') },
    ...members.map((m) => ({ value: m.userId, label: m.name })),
  ]
  const leg = editLegacyLabel?.trim()
  if (!leg) return opts
  const matched = members.some(
    (m) =>
      m.name.trim() === leg ||
      m.email.trim() === leg ||
      m.userId === leg,
  )
  if (matched) return opts
  const legacyVal = `legacy:${encodeURIComponent(leg)}`
  opts.push({
    value: legacyVal,
    label: t('kanban.taskForm.assigneeLegacy', { name: leg }),
  })
  return opts
}

function selectionValueFromInitial(
  assigneeLabel: string | undefined,
  members: BoardMember[],
): string {
  const leg = assigneeLabel?.trim() ?? ''
  if (!leg) return ''
  const byName = members.find(
    (m) => m.name.trim() === leg || m.email.trim() === leg,
  )
  if (byName) return byName.userId
  return `legacy:${encodeURIComponent(leg)}`
}

function labelFromSelection(
  value: string,
  members: BoardMember[],
  fallbackLabel?: string | null,
): string {
  if (!value) return ''
  if (value.startsWith('legacy:')) {
    try {
      return decodeURIComponent(value.slice(7))
    } catch {
      return value.slice(7)
    }
  }
  const m = members.find((x) => x.userId === value)
  if (m) return m.name
  return fallbackLabel?.trim() ?? ''
}

export type CreateTaskCardPayload = {
  title: string
  description: string
  color: string
  assigneeId: string
  assigneeLabel: string
}

export type TaskCardFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  /** Меняется при открытии другой карточки — синхронизация полей */
  resetKey?: string
  initial?: {
    title: string
    description?: string
    color?: string
    assigneeLabel?: string
    assigneeId?: string
  }
  /** Участники доски (владелец + board_members) */
  members: BoardMember[]
  membersLoading?: boolean
  /** Ошибка загрузки списка участников (сеть / RLS) */
  membersLoadError?: string | null
  onRetryLoadMembers?: () => void
  dialogTitle: string
  footerHint: string
  submitLabel: string
  /** Ошибка мутации / сети — остаётся видимой при открытом диалоге */
  errorMessage?: string | null
  onSubmit: (payload: CreateTaskCardPayload) => void | Promise<void>
}

export function TaskCardFormDialog({
  open,
  onOpenChange,
  mode,
  resetKey = mode,
  initial,
  members,
  membersLoading = false,
  membersLoadError,
  onRetryLoadMembers,
  dialogTitle,
  footerHint,
  submitLabel,
  errorMessage,
  onSubmit,
}: TaskCardFormDialogProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [assigneeId, setAssigneeId] = useState('')

  const assigneeOptions = useMemo(() => {
    const legacy = mode === 'edit' ? initial?.assigneeLabel : undefined
    return buildAssigneeOptions(members, t, legacy)
  }, [members, mode, initial?.assigneeLabel, t])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setTitle(initial.title)
      setDescription(initial.description ?? '')
      setColor(
        initial.color?.trim() && initial.color.trim().length > 0
          ? initial.color.trim()
          : DEFAULT_COLOR,
      )
    } else {
      setTitle('')
      setDescription('')
      setColor(DEFAULT_COLOR)
    }
  }, [open, mode, resetKey, initial?.title, initial?.description, initial?.color])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setAssigneeId(selectionValueFromInitial(initial.assigneeLabel, members))
    } else {
      setAssigneeId('')
    }
  }, [open, mode, resetKey, initial?.assigneeLabel, members])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const assigneeLabel = labelFromSelection(
      assigneeId,
      members,
      mode === 'edit' ? initial?.assigneeLabel : undefined,
    )
    const payload: CreateTaskCardPayload = {
      title: trimmed,
      description: description.trim(),
      color,
      assigneeId,
      assigneeLabel,
    }
    try {
      await Promise.resolve(onSubmit(payload))
      onOpenChange(false)
    } catch {
      // оставляем диалог открытым (ошибка сети / валидации)
    }
  }

  const titleId =
    mode === 'edit' ? `task-card-edit-title-${resetKey}` : 'task-card-title'
  const descId =
    mode === 'edit'
      ? `task-card-edit-desc-${resetKey}`
      : 'task-card-description'
  const assigneeSelectId =
    mode === 'edit' ? `task-card-edit-assignee-${resetKey}` : 'task-card-assignee'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 sm:max-w-[24rem]" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-sm">{footerHint}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor={titleId}>{t('kanban.taskForm.taskTitle')}</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('kanban.taskForm.titlePlaceholder')}
              autoComplete="off"
              required
              minLength={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={descId}>{t('kanban.taskForm.description')}</Label>
            <textarea
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('kanban.taskForm.descriptionPlaceholder')}
              rows={4}
              className={cn(
                'w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30',
              )}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium leading-none">
              {t('kanban.taskForm.cardColor')}
            </span>
            <div className="flex flex-wrap gap-2">
              {COLUMN_COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  aria-label={t('kanban.taskForm.colorAria', { hex })}
                  onClick={() => setColor(hex)}
                  className="size-8 rounded-md border-2 shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
                className="h-8 w-14 cursor-pointer rounded border border-border bg-background p-0.5"
                aria-label={t('common.customColor')}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="font-mono text-xs"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={assigneeSelectId}>
              {t('kanban.taskForm.assignee')}
            </Label>
            <select
              id={assigneeSelectId}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={membersLoading}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-input/30"
            >
              {assigneeOptions.map((u) => (
                <option key={u.value || 'none'} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            {membersLoading ? (
              <p className="text-xs text-muted-foreground">
                {t('kanban.taskForm.membersLoading')}
              </p>
            ) : null}
            {membersLoadError ? (
              <div className="space-y-2">
                <p className="text-xs text-destructive" role="alert">
                  {membersLoadError}
                </p>
                {onRetryLoadMembers ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => onRetryLoadMembers()}
                  >
                    {t('common.retryLoad')}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {!membersLoading &&
            !membersLoadError &&
            members.length === 0 &&
            assigneeOptions.length <= 1 ? (
              <p className="text-xs text-muted-foreground">
                {t('kanban.taskForm.noMembersHint')}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={title.trim() === ''}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type CreateTaskCardDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: BoardMember[]
  membersLoading?: boolean
  membersLoadError?: string | null
  onRetryLoadMembers?: () => void
  errorMessage?: string | null
  onCreate: (payload: CreateTaskCardPayload) => void | Promise<void>
}

export function CreateTaskCardDialog({
  open,
  onOpenChange,
  members,
  membersLoading,
  membersLoadError,
  onRetryLoadMembers,
  errorMessage,
  onCreate,
}: CreateTaskCardDialogProps) {
  const { t } = useTranslation()
  return (
    <TaskCardFormDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="create"
      resetKey="create"
      members={members}
      membersLoading={membersLoading}
      membersLoadError={membersLoadError}
      onRetryLoadMembers={onRetryLoadMembers}
      dialogTitle={t('kanban.taskForm.createTitle')}
      footerHint={t('kanban.taskForm.createHint')}
      submitLabel={t('kanban.taskForm.createSubmit')}
      errorMessage={errorMessage}
      onSubmit={onCreate}
    />
  )
}
