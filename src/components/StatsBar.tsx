'use client';

import type { JobFilters } from '@/types/job';

interface Props {
  total?: number;
  isLoading: boolean;
  filters: JobFilters;
}

export function StatsBar({ total, isLoading, filters }: Props) {
  const activeFilterCount = [
    filters.remoteOnly,
    filters.koreanSpeaking,
    filters.visaSponsorship,
    filters.region,
    filters.search,
    ...(filters.tags ?? []),
    ...(filters.seniority ?? []),
    ...(filters.industry ?? []),
  ].filter(Boolean).length;

  return (
    <div className="border-b border-border-subtle bg-bg-primary">
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-text-muted font-mono">
          {isLoading ? '...' : `${total?.toLocaleString() ?? 0} jobs`}
        </span>
        {activeFilterCount > 0 && (
          <span className="text-[10px] bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-1.5 py-0.5 rounded">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>
        )}
        {filters.search && (
          <span className="text-xs text-text-muted">
            for &ldquo;<span className="text-text-secondary">{filters.search}</span>&rdquo;
          </span>
        )}
      </div>
    </div>
  );
}
