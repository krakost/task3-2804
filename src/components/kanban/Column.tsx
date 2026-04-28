import type { ReactNode } from 'react'

import { TaskCard } from '@/components/kanban/TaskCard'

type ColumnProps = {
  title: string
  children?: ReactNode
}

export function Column({ title, children }: ColumnProps) {
  return (
    <section className="flex min-w-[200px] flex-1 flex-col rounded-md border border-border bg-card p-3 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-foreground">{title}</h2>
      <div className="flex flex-col gap-2">
        {children ?? <TaskCard title="Sample task" />}
      </div>
    </section>
  )
}
