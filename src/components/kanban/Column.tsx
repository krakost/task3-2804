import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import {
  CreateTaskCardDialog,
  type CreateTaskCardPayload,
} from '@/components/kanban/TaskCardFormDialog'
import { taskColumnDroppableId } from '@/components/kanban/board-dnd'
import { SortableTaskCard } from '@/components/kanban/SortableTaskCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteBoardColumn } from '@/hooks/useBoardColumns'
import { useCreateBoardTask } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import type { BoardColumnSummary, BoardMember, TaskSummary } from '@/types'

type ColumnProps = {
  boardId: string
  column: BoardColumnSummary
  tasks: TaskSummary[]
  boardMembers: BoardMember[]
  boardMembersLoading?: boolean
  boardMembersError?: string
  onRetryBoardMembers?: () => void
  reorderDisabled?: boolean
  onEditColumn: () => void
}

export function Column({
  boardId,
  column,
  tasks,
  boardMembers,
  boardMembersLoading,
  boardMembersError,
  onRetryBoardMembers,
  reorderDisabled,
  onEditColumn,
}: ColumnProps) {
  const { t } = useTranslation()
  const [cardDialogOpen, setCardDialogOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const createTask = useCreateBoardTask()
  const deleteColumn = useDeleteBoardColumn()
  const { reset: resetCreateTask } = createTask

  const headerBusy = createTask.isPending || deleteColumn.isPending

  const { setNodeRef: setColumnDropRef, isOver } = useDroppable({
    id: taskColumnDroppableId(column.id),
    data: { type: 'column', columnId: column.id },
  })

  const taskIds = tasks.map((tsk) => tsk.id)

  useEffect(() => {
    if (!cardDialogOpen) return
    resetCreateTask()
  }, [cardDialogOpen, resetCreateTask])

  async function handleCreateCard(payload: CreateTaskCardPayload) {
    await createTask.mutateAsync({
      boardId,
      columnId: column.id,
      title: payload.title,
      description: payload.description,
      color: payload.color,
      assigneeLabel: payload.assigneeLabel,
    })
  }

  const isEmpty = tasks.length === 0

  return (
    <section
      className="flex max-h-[min(640px,calc(100vh-14rem))] w-[280px] shrink-0 flex-col overflow-x-visible overflow-y-hidden rounded-md border border-border bg-card shadow-sm"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: column.color,
      }}
    >
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
        <h2 className="min-w-0 flex-1 text-sm leading-tight font-medium text-foreground">
          <span className="line-clamp-2">{column.title}</span>
        </h2>
        <div className="flex shrink-0 items-start gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label={t('kanban.column.editAria', { title: column.title })}
            disabled={headerBusy}
            onClick={onEditColumn}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            aria-label={t('kanban.column.deleteAria', { title: column.title })}
            disabled={headerBusy}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 />
          </Button>
        </div>
      </header>
      <div
        ref={setColumnDropRef}
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3',
          'min-h-[120px] rounded-md transition-colors',
          isOver && 'bg-muted/40 ring-1 ring-ring/40',
        )}
      >
        {isEmpty ? (
          <p className="text-center text-xs text-muted-foreground">
            {t('kanban.column.noTasks')}
          </p>
        ) : null}
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((tsk) => (
            <SortableTaskCard
              key={tsk.id}
              task={tsk}
              boardId={boardId}
              boardMembers={boardMembers}
              boardMembersLoading={boardMembersLoading}
              boardMembersError={boardMembersError}
              onRetryBoardMembers={onRetryBoardMembers}
              reorderDisabled={reorderDisabled}
            />
          ))}
        </SortableContext>
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => setCardDialogOpen(true)}
        >
          <Plus />
          {t('kanban.column.createCard')}
        </Button>
      </div>

      <CreateTaskCardDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        members={boardMembers}
        membersLoading={boardMembersLoading}
        membersLoadError={boardMembersError}
        onRetryLoadMembers={onRetryBoardMembers}
        errorMessage={createTask.error?.message}
        onCreate={handleCreateCard}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="gap-4 sm:max-w-[22rem]" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {t('kanban.column.deleteTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('kanban.column.deleteDescription', { title: column.title })}
            </DialogDescription>
          </DialogHeader>
          {deleteColumn.error ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteColumn.error.message}
            </p>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleteColumn.isPending}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteColumn.isPending}
              onClick={() => {
                void deleteColumn
                  .mutateAsync({ columnId: column.id, boardId })
                  .then(() => setConfirmDeleteOpen(false))
              }}
            >
              {deleteColumn.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
