import { useTranslation } from 'react-i18next'

import { useAuthStore } from '@/features/auth/store'
import { useBoards } from '@/hooks/useBoards'

export default function BoardsPage() {
  const { t } = useTranslation()
  const { data: boards = [], isFetching } = useBoards()
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)

  let status: string
  if (!hydrated) {
    status = t('boardsPage.loading')
  } else if (!user) {
    status = t('boardsPage.signInToSee')
  } else if (isFetching) {
    status = t('boardsPage.loading')
  } else if (boards.length === 0) {
    status = t('boardsPage.empty')
  } else {
    status = t('boardsPage.count', { count: boards.length })
  }

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('boardsPage.title')}
      </h1>
      <p className="text-muted-foreground">{status}</p>
    </div>
  )
}
