import { useQuery } from '@tanstack/react-query'

import { fetchTasksForBoard } from '@/features/tasks/api'

export function useTasks(boardId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', boardId],
    enabled: Boolean(boardId),
    queryFn: () => fetchTasksForBoard(boardId ?? ''),
  })
}
