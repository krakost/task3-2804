import { useParams } from 'react-router-dom'

import { Board } from '@/components/kanban/Board'
import { useBoard } from '@/hooks/useBoards'
import { useTasks } from '@/hooks/useTasks'

export default function BoardPage() {
  const { id } = useParams<{ id: string }>()
  const { data: board } = useBoard(id)
  const { data: tasks = [], isFetching } = useTasks(id)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {board?.title ?? 'Board'}
        </h1>
        <p className="text-sm text-muted-foreground">
          ID: {id ?? '—'}
          {id != null &&
            (isFetching
              ? ' · Loading tasks…'
              : ` · ${tasks.length} task(s) (stub)`)}
        </p>
      </div>
      <Board boardId={id} />
    </div>
  )
}
