'use client';

import { formatDistanceToNow } from 'date-fns';
import { Bookmark, CheckCircle2, ExternalLink, MapPin } from 'lucide-react';
import { SourceBadge } from './SourceBadge';
import { TagBadge } from './TagBadge';
import { cn } from '@/lib/utils';
import type { JobWithMeta } from '@/types/job';

interface Props {
  job: JobWithMeta;
  isBookmarked: boolean;
  isApplied: boolean;
  onClick: (job: JobWithMeta) => void;
  onBookmark: (id: string) => void;
  onApplied: (id: string) => void;
  isSelected?: boolean;
}

function SalaryDisplay({ min, max, currency }: { min: number | null; max: number | null; currency: string | null }) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`;
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  if (min && max) return <span className="text-accent-green text-xs font-mono">{symbol}{fmt(min)}–{symbol}{fmt(max)}</span>;
  if (min) return <span className="text-accent-green text-xs font-mono">{symbol}{fmt(min)}+</span>;
  return null;
}

export function JobCard({ job, isBookmarked, isApplied, onClick, onBookmark, onApplied, isSelected }: Props) {
  const visibleTags = job.tags.slice(0, 4);
  const moreTags = job.tags.length - visibleTags.length;

  return (
    <article
      onClick={() => onClick(job)}
      className={cn(
        'card-hover cursor-pointer p-4 animate-fade-in',
        isSelected && 'border-accent-purple/50 bg-bg-tertiary',
        isApplied && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h2 className="text-sm font-medium text-text-primary truncate">{job.title}</h2>
            {job.koreanSpeaking && (
              <span className="text-[10px] bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-1.5 py-0.5 rounded shrink-0">KO</span>
            )}
            {job.visaSponsorship && (
              <span className="text-[10px] bg-accent-green/10 text-accent-green border border-accent-green/20 px-1.5 py-0.5 rounded shrink-0">Visa</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-text-secondary text-xs">
            <span className="font-medium">{job.company}</span>
            <span className="text-border-default">·</span>
            <span className="flex items-center gap-0.5 text-text-muted">
              <MapPin size={10} />
              {job.location}
            </span>
            {(job.salaryMin || job.salaryMax) && (
              <>
                <span className="text-border-default">·</span>
                <SalaryDisplay min={job.salaryMin} max={job.salaryMax} currency={job.salaryCurrency} />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onApplied(job.id); }}
            className={cn(
              'p-1.5 rounded transition-colors',
              isApplied ? 'text-accent-green' : 'text-text-muted hover:text-text-primary'
            )}
            title={isApplied ? 'Mark as not applied' : 'Mark as applied'}
          >
            <CheckCircle2 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBookmark(job.id); }}
            className={cn(
              'p-1.5 rounded transition-colors',
              isBookmarked ? 'text-accent-purple' : 'text-text-muted hover:text-text-primary'
            )}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SourceBadge source={job.source} />
          <span className={cn(
            'text-[10px] px-1.5 py-0.5 rounded border font-medium',
            job.remoteType === 'REMOTE' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
            job.remoteType === 'HYBRID' ? 'bg-accent-orange/10 text-accent-orange border-accent-orange/20' :
            'bg-border-subtle/50 text-text-muted border-border-subtle'
          )}>
            {job.remoteType.toLowerCase()}
          </span>
          {visibleTags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          {moreTags > 0 && <span className="text-[10px] text-text-muted">+{moreTags}</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted">
            {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
          </span>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text-muted hover:text-accent-purple transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}
