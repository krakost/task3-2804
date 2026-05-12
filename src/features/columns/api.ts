import type { BoardColumnSummary } from '@/types'
import { deleteBoardTasksInColumn } from '@/features/tasks/api'
import { supabase } from '@/lib/supabase-client'

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

type ColumnRow = {
  id: string
  board_id: string
  title: string
  color: string
  position: number
}

function toSummary(row: ColumnRow): BoardColumnSummary {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    color: row.color,
    position: row.position,
  }
}

export function assertValidColumnColor(color: string): string {
  const c = color.trim()
  if (!HEX_COLOR.test(c)) {
    throw new Error('Цвет должен быть в формате #RGB или #RRGGBB.')
  }
  return c
}

export async function fetchBoardColumns(
  boardId: string,
): Promise<BoardColumnSummary[]> {
  if (!supabase) return []
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('board_columns')
    .select('id, board_id, title, color, position')
    .eq('board_id', boardId)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toSummary(row as ColumnRow))
}

export async function createBoardColumn(
  boardId: string,
  input: { title: string; color: string },
): Promise<BoardColumnSummary> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')

  const title = input.title.trim()
  if (!title) throw new Error('Название колонки обязательно.')
  const color = assertValidColumnColor(input.color)

  const { data: maxRows, error: maxError } = await supabase
    .from('board_columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1)

  if (maxError) throw new Error(maxError.message)
  const nextPosition =
    maxRows != null && maxRows.length > 0
      ? (maxRows[0] as { position: number }).position + 1
      : 0

  const { data, error } = await supabase
    .from('board_columns')
    .insert({
      board_id: boardId,
      title,
      color,
      position: nextPosition,
    })
    .select('id, board_id, title, color, position')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Failed to create column.')
  return toSummary(data as ColumnRow)
}

export async function updateBoardColumn(
  columnId: string,
  input: { title?: string; color?: string },
): Promise<BoardColumnSummary> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')

  const patch: Record<string, string> = {}
  if (input.title !== undefined) {
    const t = input.title.trim()
    if (!t) throw new Error('Название колонки обязательно.')
    patch.title = t
  }
  if (input.color !== undefined) {
    patch.color = assertValidColumnColor(input.color)
  }
  if (Object.keys(patch).length === 0) {
    throw new Error('Нет полей для обновления.')
  }

  const { data, error } = await supabase
    .from('board_columns')
    .update(patch)
    .eq('id', columnId)
    .select('id, board_id, title, color, position')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Колонка не найдена или нет доступа.')
  return toSummary(data as ColumnRow)
}

export async function deleteBoardColumn(columnId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('You must be signed in.')

  await deleteBoardTasksInColumn(columnId)

  const { error } = await supabase
    .from('board_columns')
    .delete()
    .eq('id', columnId)

  if (error) throw new Error(error.message)
}
