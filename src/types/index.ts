export type BoardSummary = {
  id: string
  title: string
  user_id: string
}

export type BoardMember = {
  userId: string
  email: string
  name: string
}

export type TaskSummary = {
  id: string
  boardId: string
  title: string
  columnId?: string
}
