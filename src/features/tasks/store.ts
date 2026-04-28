import { create } from 'zustand'

import type { TaskSummary } from '@/features/tasks/types'

type TasksState = {
  byBoardId: Record<string, TaskSummary[] | undefined>
  setTasksForBoard: (boardId: string, tasks: TaskSummary[]) => void
}

export const useTasksStore = create<TasksState>((set) => ({
  byBoardId: {},
  setTasksForBoard: (boardId, tasks) =>
    set((s) => ({
      byBoardId: { ...s.byBoardId, [boardId]: tasks },
    })),
}))
