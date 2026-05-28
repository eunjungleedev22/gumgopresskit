'use client';

import { JobCard } from './JobCard';
import type { JobWithMeta } from '@/types/job';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  jobs: JobWithMeta[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isFetching: boolean;
  bookmarkedIds: Set<string>;
  appliedIds: Set<string>;
  onSelectJob: (job: JobWithMeta) => void;
  onBookmark: (id: string) => void;
  onApplied: (id: string) => void;
  onPageChange: (page: number) => void;
}

function Skeleton() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 bg-bg-elevated rounded w-2/3 mb-2" />
      <div className="h-3 bg-bg-elevated rounded w-1/3 mb-3" />
      <div className="flex gap-2">
        <div className="h-4 bg-bg-elevated rounded w-16" />
        <div className="h-4 bg-bg-elevated rounded w-20" />
        <div className="h-4 bg-bg-elevated rounded w-14" />
      </div>
    </div>
  );
}

export function JobList({
  jobs, total, page, pageSize, isLoading, isFetching,
  bookmarkedIds, appliedIds, onSelectJob, onBookmark, onApplied, onPageChange,
}: Props) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (!isLoading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-text-muted text-sm">No jobs found for your filters.</p>
        <p className="text-text-muted text-xs mt-1">Try adjusting your search or clearing filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={`space-y-2 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isBookmarked={bookmarkedIds.has(job.id)}
            isApplied={appliedIds.has(job.id)}
            onClick={onSelectJob}
            onBookmark={onBookmark}
            onApplied={onApplied}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 py-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="btn-ghost disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-text-muted font-mono">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-ghost disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
