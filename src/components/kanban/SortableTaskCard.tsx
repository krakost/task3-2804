import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { TaskCard } from '@/components/kanban/TaskCard'
import type { BoardMember, TaskSummary } from '@/types'

type SortableTaskCardProps = {
  task: TaskSummary
  boardId: string
  boardMembers: BoardMember[]
  boardMembersLoading?: boolean
  boardMembersError?: string
  onRetryBoardMembers?: () => void
  reorderDisabled?: boolean
}

export function SortableTaskCard({
  task,
  boardId,
  boardMembers,
  boardMembersLoading,
  boardMembersError,
  onRetryBoardMembers,
  reorderDisabled = false,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: reorderDisabled,
  })

  return (
    <TaskCard
      task={task}
      boardId={boardId}
      boardMembers={boardMembers}
      boardMembersLoading={boardMembersLoading}
      boardMembersError={boardMembersError}
      onRetryBoardMembers={onRetryBoardMembers}
      sortable={{
        setNodeRef,
        style: {
          transform: CSS.Transform.toString(transform),
          transition,
        },
        attributes,
        listeners,
        isDragging,
      }}
    />
  )
}
