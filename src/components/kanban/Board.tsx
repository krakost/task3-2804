import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'

import { BoardAiBreakdownPanel } from '@/components/kanban/BoardAiBreakdownPanel'
import { Column } from '@/components/kanban/Column'
import { computeTaskReorderUpdates } from '@/components/kanban/board-dnd'
import { ColumnFormDialog } from '@/components/kanban/ColumnFormDialog'
import { Button } from '@/components/ui/button'
import { useBoardMembersQuery } from '@/hooks/useBoardMembers'
import { useBoardColumns } from '@/hooks/useBoardColumns'
import { useReorderBoardTasks, useTasks } from '@/hooks/useTasks'
import { cn } from '@/lib/utils'
import type { BoardColumnSummary, TaskSummary } from '@/types'

type BoardProps = {
  boardId?: string
}

export function Board({ boardId }: BoardProps) {
  const { t } = useTranslation()
  const { data: columns = [], isFetching } = useBoardColumns(boardId)
  const { data: tasks = [] } = useTasks(boardId)
  const {
    data: boardMembers = [],
    isLoading: boardMembersLoading,
    error: boardMembersError,
    refetch: refetchBoardMembers,
  } = useBoardMembersQuery(boardId)
  const reorderTasks = useReorderBoardTasks()
  const [activeTask, setActiveTask] = useState<TaskSummary | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editColumn, setEditColumn] = useState<BoardColumnSummary | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    const task = tasks.find((tsk) => tsk.id === id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over || active.id === over.id || !boardId) return

    const updates = computeTaskReorderUpdates(
      columns,
      tasks,
      String(active.id),
      String(over.id),
    )
    if (updates != null && updates.length > 0) {
      void reorderTasks.mutateAsync({ boardId, updates })
    }
  }

  function handleDragCancel() {
    setActiveTask(null)
  }

  function openCreate() {
    setDialogMode('create')
    setEditColumn(null)
    setDialogOpen(true)
  }

  function openEdit(col: BoardColumnSummary) {
    setDialogMode('edit')
    setEditColumn(col)
    setDialogOpen(true)
  }

  if (!boardId) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        {t('kanban.board.pickFromSidebar')}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {isFetching
              ? t('kanban.board.loadingColumns')
              : t('kanban.board.columnsCount', {
                  count: columns.length,
                })}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={openCreate}
          >
            <Plus />
            {t('kanban.board.addColumn')}
          </Button>
        </div>

        <BoardAiBreakdownPanel
          boardId={boardId}
          columns={columns}
          columnsLoading={isFetching}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div
            className="flex min-h-[280px] flex-nowrap gap-4 overflow-x-auto rounded-lg border border-dashed border-border bg-muted/30 p-4"
            data-board-id={boardId}
          >
            {columns.length === 0 && !isFetching ? (
              <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 rounded-md border border-border bg-card/50 px-4 text-center text-sm text-muted-foreground">
                <p>{t('kanban.board.noColumns')}</p>
                <Button type="button" size="sm" onClick={openCreate}>
                  {t('kanban.board.addFirstColumn')}
                </Button>
              </div>
            ) : (
              columns.map((col) => (
                <Column
                  key={col.id}
                  boardId={boardId}
                  column={col}
                  tasks={tasks
                    .filter((tsk) => tsk.columnId === col.id)
                    .sort((a, b) => a.position - b.position)}
                  boardMembers={boardMembers}
                  boardMembersLoading={boardMembersLoading}
                  boardMembersError={
                    boardMembersError instanceof Error
                      ? boardMembersError.message
                      : boardMembersError
                        ? String(boardMembersError)
                        : undefined
                  }
                  onRetryBoardMembers={() => {
                    void refetchBoardMembers()
                  }}
                  reorderDisabled={reorderTasks.isPending}
                  onEditColumn={() => openEdit(col)}
                />
              ))
            )}
          </div>
          {typeof document !== 'undefined'
            ? createPortal(
                <DragOverlay zIndex={1100} dropAnimation={null}>
                  {activeTask ? (
                    <div
                      className={cn(
                        'w-[252px] rounded-md border border-border bg-background px-3 py-2 text-sm shadow-lg',
                      )}
                      style={{
                        borderLeftWidth: 4,
                        borderLeftColor: activeTask.color,
                      }}
                    >
                      <p className="font-medium leading-snug">
                        {activeTask.title}
                      </p>
                      {activeTask.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {activeTask.description}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body,
              )
            : null}
        </DndContext>
      </div>

      <ColumnFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditColumn(null)
        }}
        mode={dialogMode}
        boardId={boardId}
        column={editColumn}
      />
    </>
  )
}
