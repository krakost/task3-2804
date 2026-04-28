import { Column } from '@/components/kanban/Column'

type BoardProps = {
  boardId?: string
}

export function Board({ boardId }: BoardProps) {
  return (
    <div
      className="flex min-h-[280px] gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4"
      data-board-id={boardId}
    >
      <Column title="To do" />
      <Column title="In progress" />
      <Column title="Done" />
    </div>
  )
}
