export type BoardSummary = {
  id: string
  title: string
}

export type TaskSummary = {
  id: string
  boardId: string
  title: string
  columnId?: string
}
