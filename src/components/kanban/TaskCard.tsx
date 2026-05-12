import { useState } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'

import {
  type CreateTaskCardPayload,
  TaskCardFormDialog,
} from '@/components/kanban/TaskCardFormDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteBoardTask, useUpdateBoardTask } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import type { BoardMember, TaskSummary } from '@/types'

export type TaskCardSortableProps = {
  setNodeRef: (node: HTMLElement | null) => void
  style?: React.CSSProperties
  attributes: DraggableAttributes
  listeners?: SyntheticListenerMap
  isDragging?: boolean
}

type TaskCardProps = {
  task: TaskSummary
  boardId: string
  boardMembers: BoardMember[]
  boardMembersLoading?: boolean
  boardMembersError?: string
  onRetryBoardMembers?: () => void
  sortable?: TaskCardSortableProps
}

export function TaskCard({
  task,
  boardId,
  boardMembers,
  boardMembersLoading,
  boardMembersError,
  onRetryBoardMembers,
  sortable,
}: TaskCardProps) {
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const deleteTask = useDeleteBoardTask()
  const updateTask = useUpdateBoardTask()
  const busy = deleteTask.isPending || updateTask.isPending

  async function handleSave(p: CreateTaskCardPayload) {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        title: p.title,
        description: p.description,
        color: p.color,
        assigneeLabel: p.assigneeLabel,
      })
    } catch {
      // ошибка в состоянии мутации
    }
  }

  return (
    <>
      <div
        ref={sortable?.setNodeRef}
        className={cn(
          'group flex flex-col gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm text-card-foreground shadow-sm',
          sortable?.isDragging && 'pointer-events-none opacity-0',
        )}
        style={{
          borderLeftWidth: 4,
          borderLeftColor: task.color,
          ...sortable?.style,
        }}
        {...sortable?.attributes}
        {...sortable?.listeners}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug">{task.title}</p>
            {task.description ? (
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                {task.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 max-sm:opacity-100"
              aria-label={t('kanban.taskCard.editAria', { title: task.title })}
              disabled={busy}
              onClick={() => setEditOpen(true)}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 max-sm:opacity-100"
              aria-label={t('kanban.taskCard.deleteAria', {
                title: task.title,
              })}
              disabled={busy}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        {task.assigneeLabel?.trim() ? (
          <p className="text-xs text-muted-foreground">
            {t('kanban.taskCard.assignee')}{' '}
            <span className="text-foreground">{task.assigneeLabel}</span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('kanban.taskCard.noAssignee')}
          </p>
        )}
      </div>

      <TaskCardFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        resetKey={task.id}
        initial={{
          title: task.title,
          description: task.description,
          color: task.color,
          assigneeLabel: task.assigneeLabel,
        }}
        members={boardMembers}
        membersLoading={boardMembersLoading}
        membersLoadError={boardMembersError}
        onRetryLoadMembers={onRetryBoardMembers}
        dialogTitle={t('kanban.taskCard.dialogEditTitle')}
        footerHint={t('kanban.taskCard.dialogEditHint')}
        submitLabel={t('common.save')}
        onSubmit={handleSave}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="gap-4 sm:max-w-[22rem]" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {t('kanban.taskCard.deleteCardTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('kanban.taskCard.deleteCardDescription', { title: task.title })}
            </DialogDescription>
          </DialogHeader>
          {deleteTask.error ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteTask.error.message}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteTask.isPending}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteTask.isPending}
              onClick={() => {
                void deleteTask
                  .mutateAsync({ taskId: task.id, boardId })
                  .then(() => setConfirmDeleteOpen(false))
              }}
            >
              {deleteTask.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
