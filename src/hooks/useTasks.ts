import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/store'
import {
  createBoardTask,
  deleteBoardTask,
  fetchTasksForBoard,
  reorderBoardTasks,
  updateBoardTask,
  type TaskPositionUpdate,
} from '@/features/tasks/api'
import { supabase } from '@/lib/supabase-client'

export function useTasks(boardId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['tasks', boardId, user?.id ?? 'guest'],
    queryFn: () => fetchTasksForBoard(boardId!),
    enabled: Boolean(supabase && user && boardId),
  })
}

export function useCreateBoardTask() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: ({
      boardId,
      columnId,
      title,
      description,
      color,
      assigneeLabel,
    }: {
      boardId: string
      columnId: string
      title: string
      description?: string
      color?: string
      assigneeLabel?: string
    }) =>
      createBoardTask(boardId, columnId, {
        title,
        description,
        color,
        assigneeLabel,
      }),
    onSuccess: (task) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['tasks', task.boardId, user.id],
        })
      }
    },
  })
}

export function useUpdateBoardTask() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: ({
      taskId,
      title,
      description,
      color,
      assigneeLabel,
    }: {
      taskId: string
      title?: string
      description?: string
      color?: string
      assigneeLabel?: string
    }) =>
      updateBoardTask(taskId, {
        title,
        description,
        color,
        assigneeLabel,
      }),
    onSuccess: (task) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['tasks', task.boardId, user.id],
        })
      }
    },
  })
}

export function useReorderBoardTasks() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: ({
      boardId: boardIdArg,
      updates,
    }: {
      boardId: string
      updates: TaskPositionUpdate[]
    }) => reorderBoardTasks(updates).then(() => boardIdArg),
    onSuccess: (boardId) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['tasks', boardId, user.id],
        })
      }
    },
  })
}

export function useDeleteBoardTask() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: ({
      taskId,
      boardId,
    }: {
      taskId: string
      boardId: string
    }) => deleteBoardTask(taskId).then(() => ({ boardId })),
    onSuccess: ({ boardId }) => {
      if (user?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['tasks', boardId, user.id],
        })
      }
    },
  })
}
