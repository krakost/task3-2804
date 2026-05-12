import type { TaskSummary } from '@/features/tasks/types'
import { supabase } from '@/lib/supabase-client'

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function assertValidCardColor(color: string): string {
  const c = color.trim()
  if (!HEX_COLOR.test(c)) {
    throw new Error('Цвет должен быть в формате #RGB или #RRGGBB.')
  }
  return c
}

type TaskRow = {
  id: string
  board_id: string
  column_id: string
  title: string
  description: string | null
  card_color: string | null
  assignee_label: string | null
  position: number
}

function toSummary(row: TaskRow): TaskSummary {
  return {
    id: row.id,
    boardId: row.board_id,
    columnId: row.column_id,
    title: row.title,
    description: row.description ?? '',
    color: row.card_color?.trim() || '#71717a',
    assigneeLabel: row.assignee_label ?? '',
    position: row.position,
  }
}

export async function fetchTasksForBoard(boardId: string): Promise<TaskSummary[]> {
  if (!supabase) return []
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('board_tasks')
    .select(
      'id, board_id, column_id, title, description, card_color, assignee_label, position',
    )
    .eq('board_id', boardId)
    .order('column_id', { ascending: true })
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toSummary(row as TaskRow))
}

export async function createBoardTask(
  boardId: string,
  columnId: string,
  fields: {
    title: string
    description?: string
    color?: string
    assigneeLabel?: string
  },
): Promise<TaskSummary> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')

  const t = fields.title.trim()
  if (!t) throw new Error('Название задачи обязательно.')

  const description = fields.description?.trim() ?? ''
  const card_color = fields.color
    ? assertValidCardColor(fields.color)
    : '#71717a'
  const assignee_label = fields.assigneeLabel?.trim() ?? ''

  const { data: maxRows, error: maxError } = await supabase
    .from('board_tasks')
    .select('position')
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1)

  if (maxError) throw new Error(maxError.message)
  const nextPosition =
    maxRows != null && maxRows.length > 0
      ? (maxRows[0] as { position: number }).position + 1
      : 0

  const { data, error } = await supabase
    .from('board_tasks')
    .insert({
      board_id: boardId,
      column_id: columnId,
      title: t,
      description,
      card_color,
      assignee_label,
      position: nextPosition,
    })
    .select(
      'id, board_id, column_id, title, description, card_color, assignee_label, position',
    )
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Failed to create task.')
  return toSummary(data as TaskRow)
}

export async function updateBoardTask(
  taskId: string,
  input: {
    title?: string
    description?: string
    color?: string
    assigneeLabel?: string
  },
): Promise<TaskSummary> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')

  const patch: Record<string, string> = {}
  if (input.title !== undefined) {
    const t = input.title.trim()
    if (!t) throw new Error('Название задачи обязательно.')
    patch.title = t
  }
  if (input.description !== undefined) {
    patch.description = input.description.trim()
  }
  if (input.color !== undefined) {
    patch.card_color = assertValidCardColor(input.color)
  }
  if (input.assigneeLabel !== undefined) {
    patch.assignee_label = input.assigneeLabel.trim()
  }
  if (Object.keys(patch).length === 0) {
    throw new Error('Нет полей для обновления.')
  }

  const { data, error } = await supabase
    .from('board_tasks')
    .update(patch)
    .eq('id', taskId)
    .select(
      'id, board_id, column_id, title, description, card_color, assignee_label, position',
    )
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Задача не найдена или нет доступа.')
  return toSummary(data as TaskRow)
}

export type TaskPositionUpdate = {
  taskId: string
  columnId: string
  position: number
}

export async function reorderBoardTasks(
  updates: TaskPositionUpdate[],
): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')
  if (updates.length === 0) return

  await Promise.all(
    updates.map(async ({ taskId, columnId, position }) => {
      const { error } = await client
        .from('board_tasks')
        .update({ column_id: columnId, position })
        .eq('id', taskId)
      if (error) throw new Error(error.message)
    }),
  )
}

export async function deleteBoardTask(taskId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')

  const { error } = await supabase
    .from('board_tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw new Error(error.message)
}

/** Удаляет все задачи колонки (перед удалением колонки, если в БД нет ON DELETE CASCADE). */
export async function deleteBoardTasksInColumn(columnId: string): Promise<void> {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')

  const { error } = await client
    .from('board_tasks')
    .delete()
    .eq('column_id', columnId)

  if (error) throw new Error(error.message)
}
