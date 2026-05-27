import { cn } from '@/lib/utils'
import type { PipelineStage } from '@/types'
import { getStageMeta } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn('text-2xs font-mono px-2 py-0.5 rounded border', className)}>
      {children}
    </span>
  )
}

interface StageBadgeProps {
  stage: PipelineStage
  className?: string
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const meta = getStageMeta(stage)
  return (
    <span className={cn('text-2xs font-mono px-2 py-0.5 rounded', meta.color, className)}>
      {meta.label}
    </span>
  )
}

interface FitScoreBadgeProps {
  score: number
  className?: string
}

export function FitScoreBadge({ score, className }: FitScoreBadgeProps) {
  const color =
    score >= 80 ? 'text-emerald-400 border-emerald-900' :
    score >= 60 ? 'text-amber-400 border-amber-900' :
    'text-zinc-400 border-zinc-700'
  return (
    <span className={cn('text-sm font-semibold tabular-nums border px-2.5 py-1 rounded-md', color, className)}>
      {score}
    </span>
  )
}
