'use client';

import { Bookmark, CheckCircle2, ExternalLink, X, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { SourceBadge } from './SourceBadge';
import { TagBadge } from './TagBadge';
import { cn } from '@/lib/utils';
import type { JobWithMeta } from '@/types/job';

interface Props {
  job: JobWithMeta;
  isBookmarked: boolean;
  isApplied: boolean;
  onBookmark: () => void;
  onApplied: () => void;
  onClose: () => void;
}

export function JobDetailPanel({ job, isBookmarked, isApplied, onBookmark, onApplied, onClose }: Props) {
  return (
    <div className="p-5 animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <SourceBadge source={job.source} />
            {job.koreanSpeaking && (
              <span className="text-[10px] bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-1.5 py-0.5 rounded">KO</span>
            )}
            {job.visaSponsorship && (
              <span className="text-[10px] bg-accent-green/10 text-accent-green border border-accent-green/20 px-1.5 py-0.5 rounded">Visa</span>
            )}
          </div>
          <h1 className="text-base font-semibold text-text-primary leading-tight">{job.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{job.company}</p>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 ml-2 shrink-0">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <MapPin size={12} className="text-text-muted" />
          {job.location}
          <span className={cn(
            'ml-1 text-[10px] px-1.5 py-0.5 rounded border',
            job.remoteType === 'REMOTE' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' : 'bg-border-subtle/50 text-text-muted border-border-subtle'
          )}>
            {job.remoteType.toLowerCase()}
          </span>
        </div>

        {(job.salaryMin || job.salaryMax) && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <DollarSign size={12} className="text-text-muted" />
            <span className="text-accent-green font-mono">
              {job.salaryCurrency === 'EUR' ? '€' : job.salaryCurrency === 'GBP' ? '£' : '$'}
              {job.salaryMin ? `${Math.round(job.salaryMin / 1000)}k` : ''}
              {job.salaryMin && job.salaryMax ? '–' : ''}
              {job.salaryMax ? `${Math.round(job.salaryMax / 1000)}k` : ''}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Calendar size={12} />
          {format(new Date(job.postedAt), 'MMM d, yyyy')}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
      </div>

      <div className="flex gap-2 mb-5">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex items-center gap-1.5 flex-1 justify-center"
        >
          Apply <ExternalLink size={12} />
        </a>
        <button
          onClick={onApplied}
          className={cn(
            'p-2 rounded border transition-colors',
            isApplied
              ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
              : 'border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default'
          )}
          title={isApplied ? 'Mark as not applied' : 'Mark as applied'}
        >
          <CheckCircle2 size={16} />
        </button>
        <button
          onClick={onBookmark}
          className={cn(
            'p-2 rounded border transition-colors',
            isBookmarked
              ? 'border-accent-purple/30 bg-accent-purple/10 text-accent-purple'
              : 'border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default'
          )}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {job.description && (
        <div className="border-t border-border-subtle pt-4">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Description</h3>
          <div
            className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-1"
            style={{ wordBreak: 'break-word' }}
          >
            {job.description.slice(0, 3000)}
            {job.description.length > 3000 && '...'}
          </div>
        </div>
      )}
    </div>
  );
}
