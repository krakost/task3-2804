import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/store'
import {
  createBoard,
  deleteBoard,
  fetchBoard,
  fetchBoards,
} from '@/features/boards/api'
import type { BoardSummary } from '@/features/boards/types'
import { supabase } from '@/lib/supabase-client'

export function useBoards() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['boards', user?.id ?? 'guest'],
    queryFn: fetchBoards,
    enabled: Boolean(supabase && user),
  })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: createBoard,
    onSuccess: (board) => {
      if (!user?.id) return
      queryClient.setQueryData<BoardSummary[]>(['boards', user.id], (prev) => [
        board,
        ...(prev ?? []),
      ])
    },
  })
}

export function useBoard(boardId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['board', boardId, user?.id ?? 'guest'],
    queryFn: () => fetchBoard(boardId!),
    enabled: Boolean(supabase && user && boardId),
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: deleteBoard,
    onSuccess: (_void, boardId) => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['boards', user.id] })
      }
      queryClient.removeQueries({ queryKey: ['board', boardId] })
      queryClient.removeQueries({ queryKey: ['tasks', boardId] })
    },
  })
}
