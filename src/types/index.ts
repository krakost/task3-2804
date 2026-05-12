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

export type BoardColumnSummary = {
  id: string
  boardId: string
  title: string
  color: string
  position: number
}

export type TaskSummary = {
  id: string
  boardId: string
  columnId: string
  title: string
  description: string
  color: string
  assigneeLabel: string
  position: number
}
