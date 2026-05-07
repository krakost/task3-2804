import { useAuthStore } from '@/features/auth/store'
import { useBoards } from '@/hooks/useBoards'

export default function BoardsPage() {
  const { data: boards = [], isFetching } = useBoards()
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)

  let status: string
  if (!hydrated) {
    status = 'Loading…'
  } else if (!user) {
    status = 'Войдите, чтобы видеть доски.'
  } else if (isFetching) {
    status = 'Loading…'
  } else if (boards.length === 0) {
    status = 'Пока нет досок — создайте первую в сайдбаре.'
  } else {
    status = `${boards.length} board(s).`
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>
      <p className="text-muted-foreground">{status}</p>
    </div>
  )
}
