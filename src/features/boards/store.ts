import { create } from 'zustand'

import type { BoardSummary } from '@/features/boards/types'

type BoardsState = {
  selectedBoardId: string | null
  setSelectedBoardId: (id: string | null) => void
}

export const useBoardsStore = create<BoardsState>((set) => ({
  selectedBoardId: null,
  setSelectedBoardId: (id) => set({ selectedBoardId: id }),
}))

export function hydrateBoardsFromApi(boards: BoardSummary[]): void {
  void boards
  // wired when API is integrated
}
