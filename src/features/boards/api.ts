import type { BoardSummary } from '@/features/boards/types'

export async function fetchBoards(): Promise<BoardSummary[]> {
  return []
}

export async function fetchBoard(id: string): Promise<BoardSummary | null> {
  void id
  return null
}
