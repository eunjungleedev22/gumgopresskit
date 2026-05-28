import type { Source } from '@/types/job';
import { cn } from '@/lib/utils';

const SOURCE_CONFIG: Record<Source, { label: string; color: string }> = {
  JSEARCH: { label: 'JSearch', color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' },
  ADZUNA: { label: 'Adzuna', color: 'bg-accent-green/10 text-accent-green border-accent-green/20' },
  ARBEITNOW: { label: 'Arbeitnow', color: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20' },
};

export function SourceBadge({ source }: { source: Source }) {
  const config = SOURCE_CONFIG[source];
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-mono', config.color)}>
      {config.label}
    </span>
  );
}
