import type { TaskPositionUpdate } from '@/features/tasks/api'
import type { BoardColumnSummary, TaskSummary } from '@/types'

/** Префикс id для useDroppable зоны колонки (не должен совпадать с uuid задачи). */
export const TASK_COLUMN_DROPPABLE_PREFIX = 'dnd-column-'

export function taskColumnDroppableId(columnId: string): string {
  return `${TASK_COLUMN_DROPPABLE_PREFIX}${columnId}`
}

export function parseTaskColumnDroppableId(overId: string): string | null {
  if (!overId.startsWith(TASK_COLUMN_DROPPABLE_PREFIX)) return null
  return overId.slice(TASK_COLUMN_DROPPABLE_PREFIX.length)
}

/** Вычисляет минимальный набор обновлений position/column_id после drop. */
export function computeTaskReorderUpdates(
  columns: BoardColumnSummary[],
  tasks: TaskSummary[],
  activeId: string,
  overId: string,
): TaskPositionUpdate[] | null {
  if (activeId === overId) return null

  const mutable = new Map<string, string[]>()
  for (const col of columns) {
    const ids = tasks
      .filter((t) => t.columnId === col.id)
      .sort((a, b) => a.position - b.position)
      .map((t) => t.id)
    mutable.set(col.id, ids)
  }

  const taskById = new Map(tasks.map((t) => [t.id, t]))

  let sourceCol: string | null = null
  let sourceIdx = -1
  for (const [cid, ids] of mutable) {
    const i = ids.indexOf(activeId)
    if (i >= 0) {
      sourceCol = cid
      sourceIdx = i
      break
    }
  }
  if (sourceCol == null) return null

  const fromList = mutable.get(sourceCol)!
  if (sourceIdx < 0 || sourceIdx >= fromList.length) return null
  const [removed] = fromList.splice(sourceIdx, 1)
  if (removed !== activeId) return null

  let destCol: string
  let destIdx: number

  const columnDrop = parseTaskColumnDroppableId(overId)
  if (columnDrop != null) {
    destCol = columnDrop
    const list = mutable.get(destCol)
    if (!list) {
      fromList.splice(sourceIdx, 0, activeId)
      return null
    }
    destIdx = list.length
  } else {
    let found: [string, number] | null = null
    for (const [cid, ids] of mutable) {
      const i = ids.indexOf(overId)
      if (i >= 0) {
        found = [cid, i]
        break
      }
    }
    if (!found) {
      fromList.splice(sourceIdx, 0, activeId)
      return null
    }
    destCol = found[0]
    destIdx = found[1]
  }

  const toList = mutable.get(destCol)
  if (!toList) {
    fromList.splice(sourceIdx, 0, activeId)
    return null
  }
  toList.splice(destIdx, 0, activeId)

  const updates: TaskPositionUpdate[] = []
  for (const [cid, ids] of mutable) {
    ids.forEach((tid, pos) => {
      const t = taskById.get(tid)
      if (!t) return
      if (t.columnId !== cid || t.position !== pos) {
        updates.push({ taskId: tid, columnId: cid, position: pos })
      }
    })
  }
  return updates.length > 0 ? updates : null
}
