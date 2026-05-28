'use client';

import { useBookmarks } from '@/hooks/useBookmarks';
import { useApplications } from '@/hooks/useApplications';
import { JobCard } from '@/components/JobCard';
import Link from 'next/link';

export default function BookmarksPage() {
  const { bookmarks, bookmarkedIds, toggleBookmark, isLoading } = useBookmarks();
  const { appliedIds, toggleApplied } = useApplications();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-border-subtle sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent-purple flex items-center justify-center">
              <span className="text-xs font-bold text-white">R</span>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-tight">Remote Job Machine</span>
          </Link>
          <span className="text-text-muted text-sm">/</span>
          <span className="text-sm text-text-secondary">Saved Jobs</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-lg font-semibold">
            Saved Jobs
            {bookmarks.length > 0 && (
              <span className="ml-2 text-text-muted text-sm font-normal">{bookmarks.length}</span>
            )}
          </h1>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-text-muted text-sm">Loading...</div>
        )}

        {!isLoading && bookmarks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No saved jobs yet.</p>
            <Link href="/" className="text-accent-purple text-sm hover:underline mt-2 inline-block">Browse jobs</Link>
          </div>
        )}

        <div className="space-y-2">
          {bookmarks.map((b) => (
            <JobCard
              key={b.job.id}
              job={b.job as any}
              isBookmarked={bookmarkedIds.has(b.job.id)}
              isApplied={appliedIds.has(b.job.id)}
              onBookmark={() => toggleBookmark(b.job.id)}
              onApplied={() => toggleApplied(b.job.id)}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
