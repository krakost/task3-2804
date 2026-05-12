import type { BoardMember, BoardSummary } from '@/features/boards/types'
import { supabase } from '@/lib/supabase-client'

type BoardRow = {
  id: string
  title: string
  user_id: string
}

function toSummary(row: BoardRow): BoardSummary {
  return { id: row.id, title: row.title, user_id: row.user_id }
}

/** Escape LIKE wildcards in user-supplied search text */
function escapeIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export type ProfileSearchHit = {
  id: string
  name: string
  email: string
}

export async function fetchBoards(): Promise<BoardSummary[]> {
  if (!supabase) return []
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('boards')
    .select('id, title, user_id')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => toSummary(row as BoardRow))
}

export async function fetchBoard(id: string): Promise<BoardSummary | null> {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('boards')
    .select('id, title, user_id')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return toSummary(data as BoardRow)
}

export async function createBoard(title: string): Promise<BoardSummary> {
  const t = title.trim()
  if (!t) {
    throw new Error('Title is required.')
  }
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) {
    throw new Error('You must be signed in to create a board.')
  }

  const { data, error } = await supabase
    .from('boards')
    .insert({ title: t, user_id: user.id })
    .select('id, title, user_id')
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Failed to create board.')
  return toSummary(data as BoardRow)
}

export async function deleteBoard(boardId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    throw new Error('You must be signed in.')
  }

  const { error } = await supabase.from('boards').delete().eq('id', boardId)

  if (error) throw new Error(error.message)
}

export async function searchProfiles(query: string): Promise<ProfileSearchHit[]> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const q = query.trim()
  if (q.length < 2) return []

  const pattern = `%${escapeIlike(q)}%`

  const [byEmail, byName] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', pattern)
      .limit(20),
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('full_name', pattern)
      .limit(20),
  ])

  if (byEmail.error) throw new Error(byEmail.error.message)
  if (byName.error) throw new Error(byName.error.message)

  type ProfileRow = {
    id: string
    email: string | null
    full_name: string | null
  }

  const map = new Map<string, ProfileRow>()
  for (const row of [...(byEmail.data ?? []), ...(byName.data ?? [])] as ProfileRow[]) {
    map.set(row.id, row)
  }

  return [...map.values()].map((row) => ({
    id: row.id,
    email: row.email ?? '',
    name: (row.full_name?.trim() || row.email || row.id).toString(),
  }))
}

type ProfileJoin = {
  id: string
  email: string | null
  full_name: string | null
}

function memberFromProfileRow(
  userId: string,
  p: ProfileJoin | null,
): BoardMember {
  const email = p?.email ?? ''
  const name = (p?.full_name?.trim() || p?.email || userId).toString()
  return { userId, email, name }
}

export async function fetchBoardMembers(boardId: string): Promise<BoardMember[]> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const board = await fetchBoard(boardId)

  const { data: memberRows, error: membersError } = await supabase
    .from('board_members')
    .select('user_id')
    .eq('board_id', boardId)

  if (membersError) throw new Error(membersError.message)

  const memberIds = (memberRows ?? []).map(
    (r: { user_id: string }) => r.user_id,
  )

  let orderedUserIds: string[] = [...memberIds]
  if (board != null && !orderedUserIds.includes(board.user_id)) {
    orderedUserIds = [board.user_id, ...orderedUserIds]
  }

  const seen = new Set<string>()
  const uniqueOrdered: string[] = []
  for (const id of orderedUserIds) {
    if (seen.has(id)) continue
    seen.add(id)
    uniqueOrdered.push(id)
  }

  if (uniqueOrdered.length === 0) {
    return []
  }

  const { data: profileRows, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', uniqueOrdered)

  if (profilesError) throw new Error(profilesError.message)

  const profileMap = new Map<string, ProfileJoin>()
  for (const row of (profileRows ?? []) as ProfileJoin[]) {
    profileMap.set(row.id, row)
  }

  return uniqueOrdered.map((userId) =>
    memberFromProfileRow(userId, profileMap.get(userId) ?? null),
  )
}

export async function addBoardMember(
  boardId: string,
  memberUserId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('You must be signed in.')

  const { error } = await supabase.from('board_members').insert({
    board_id: boardId,
    user_id: memberUserId,
    invited_by: user.id,
  })

  if (error) {
    if (error.code === '23505') {
      throw new Error('Пользователь уже добавлен.')
    }
    throw new Error(error.message)
  }
}

export async function removeBoardMember(
  boardId: string,
  memberUserId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', memberUserId)

  if (error) throw new Error(error.message)
}
