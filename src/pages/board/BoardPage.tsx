import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { Board } from '@/components/kanban/Board'
import { useBoard } from '@/hooks/useBoards'
import { useTasks } from '@/hooks/useTasks'

export default function BoardPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { data: board } = useBoard(id)
  const { data: tasks = [], isFetching } = useTasks(id)

  const metaSuffix =
    id != null
      ? isFetching
        ? t('boardPage.loadingTasks')
        : t('boardPage.tasksCount', { count: tasks.length })
      : ''

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {board?.title ?? t('boardPage.boardFallback')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('boardPage.idPrefix')} {id ?? '—'}
          {metaSuffix}
        </p>
      </div>
      <Board boardId={id} />
    </div>
  )
}
