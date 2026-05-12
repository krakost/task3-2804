import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/store'
import {
  createBoardColumn,
  deleteBoardColumn,
  fetchBoardColumns,
  updateBoardColumn,
} from '@/features/columns/api'
import { supabase } from '@/lib/supabase-client'

export function useBoardColumns(boardId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['board-columns', boardId, user?.id ?? 'guest'],
    queryFn: () => fetchBoardColumns(boardId!),
    enabled: Boolean(supabase && user && boardId),
  })
}

export function useCreateBoardColumn() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: ({
      boardId,
      title,
      color,
    }: {
      boardId: string
      title: string
      color: string
    }) => createBoardColumn(boardId, { title, color }),
    onSuccess: (column) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['board-columns', column.boardId, user.id],
        })
      }
    },
  })
}

export function useUpdateBoardColumn() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: ({
      columnId,
      title,
      color,
    }: {
      columnId: string
      title?: string
      color?: string
    }) => updateBoardColumn(columnId, { title, color }),
    onSuccess: (column) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['board-columns', column.boardId, user.id],
        })
      }
    },
  })
}

export function useDeleteBoardColumn() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: ({
      columnId,
      boardId,
    }: {
      columnId: string
      boardId: string
    }) => deleteBoardColumn(columnId).then(() => ({ boardId })),
    onSuccess: ({ boardId }) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['board-columns', boardId, user.id],
        })
        void queryClient.invalidateQueries({
          queryKey: ['tasks', boardId, user.id],
        })
      }
    },
  })
}
