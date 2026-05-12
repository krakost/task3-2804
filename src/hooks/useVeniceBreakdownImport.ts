import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/store'
import { requestVeniceBreakdown } from '@/features/ai/api'
import { createBoardTask } from '@/features/tasks/api'

export type VeniceBreakdownImportVariables = {
  boardId: string
  columnId: string
  taskText: string
}

export function useVeniceBreakdownImport() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async ({
      boardId,
      columnId,
      taskText,
    }: VeniceBreakdownImportVariables) => {
      const items = await requestVeniceBreakdown(taskText)
      if (items.length === 0) {
        throw new Error('NO_ITEMS')
      }
      for (const item of items) {
        await createBoardTask(boardId, columnId, {
          title: item.title,
          description: item.description,
          color: item.color,
        })
      }
      return {
        boardId,
        count: items.length,
        titles: items.map((i) => i.title),
      }
    },
    onSuccess: ({ boardId }) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['tasks', boardId, user.id],
        })
      }
    },
  })
}
