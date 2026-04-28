import { useQuery } from '@tanstack/react-query'

import { fetchBoards } from '@/features/boards/api'

export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: fetchBoards,
  })
}
