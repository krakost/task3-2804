import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/store'
import {
  addBoardMember,
  fetchBoardMembers,
  removeBoardMember,
  searchProfiles,
} from '@/features/boards/api'
import { supabase } from '@/lib/supabase-client'

export function useBoardMembers(boardId: string | null, dialogOpen: boolean) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['board-members', boardId, user?.id],
    queryFn: () => fetchBoardMembers(boardId!),
    enabled: Boolean(supabase && user && boardId && dialogOpen),
  })
}

/** Участники доски (кэш тот же, что у настроек доски). */
export function useBoardMembersQuery(boardId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['board-members', boardId, user?.id],
    queryFn: () => fetchBoardMembers(boardId!),
    enabled: Boolean(supabase && user && boardId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useSearchProfiles(searchQuery: string) {
  const user = useAuthStore((s) => s.user)
  const q = searchQuery.trim()
  return useQuery({
    queryKey: ['profiles-search', q],
    queryFn: () => searchProfiles(q),
    enabled: Boolean(supabase && user && q.length >= 2),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useAddBoardMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      boardId,
      userId,
    }: {
      boardId: string
      userId: string
    }) => addBoardMember(boardId, userId),
    onSuccess: (_data, { boardId }) => {
      void queryClient.invalidateQueries({ queryKey: ['board-members', boardId] })
      void queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}

export function useRemoveBoardMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      boardId,
      userId,
    }: {
      boardId: string
      userId: string
    }) => removeBoardMember(boardId, userId),
    onSuccess: (_data, { boardId }) => {
      void queryClient.invalidateQueries({ queryKey: ['board-members', boardId] })
      void queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}
