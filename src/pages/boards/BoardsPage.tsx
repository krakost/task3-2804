import { useBoards } from '@/hooks/useBoards'

export default function BoardsPage() {
  const { data: boards = [], isFetching } = useBoards()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>
      <p className="text-muted-foreground">
        {isFetching
          ? 'Loading…'
          : boards.length === 0
            ? 'No boards yet — wire `fetchBoards` in `features/boards/api`.'
            : `${boards.length} board(s).`}
      </p>
    </div>
  )
}
