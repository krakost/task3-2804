import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type FeatureCardProps = {
  icon: LucideIcon
  title: string
  children: ReactNode
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  children,
  className,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        'rounded-[20px] border border-feature-stroke bg-feature-card px-8 py-8 shadow-sm',
        className,
      )}
    >
      <div
        className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-feature-iconbox text-feature-gold"
        aria-hidden
      >
        <Icon className="size-5 stroke-[1.75]" />
      </div>
      <h3 className="mb-3 text-left text-lg font-bold leading-tight text-white">
        {title}
      </h3>
      <p className="text-left text-sm font-normal leading-relaxed text-feature-muted">
        {children}
      </p>
    </article>
  )
}
