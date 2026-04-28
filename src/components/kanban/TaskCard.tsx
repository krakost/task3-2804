type TaskCardProps = {
  title: string
}

export function TaskCard({ title }: TaskCardProps) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-card-foreground shadow-sm">
      {title}
    </div>
  )
}
