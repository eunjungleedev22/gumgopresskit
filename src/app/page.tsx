'use client';

import { useState, useCallback } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useApplications } from '@/hooks/useApplications';
import { SearchBar } from '@/components/SearchBar';
import { FilterSidebar } from '@/components/FilterSidebar';
import { JobList } from '@/components/JobList';
import { JobDetailPanel } from '@/components/JobDetailPanel';
import { StatsBar } from '@/components/StatsBar';
import type { JobFilters, JobWithMeta } from '@/types/job';

export default function HomePage() {
  const [filters, setFilters] = useState<JobFilters>({ page: 1, pageSize: 20 });
  const [selectedJob, setSelectedJob] = useState<JobWithMeta | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data, isLoading, isFetching } = useJobs(filters);
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const { appliedIds, toggleApplied } = useApplications();

  const handleSearch = useCallback((search: string) => {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((updates: Partial<JobFilters>) => {
    setFilters((f) => ({ ...f, ...updates, page: 1 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((f) => ({ ...f, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Top Nav */}
      <header className="border-b border-border-subtle sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-5 h-5 rounded bg-accent-purple flex items-center justify-center">
              <span className="text-xs font-bold text-white">R</span>
            </div>
            <span className="text-sm font-semibold text-text-primary tracking-tight">Remote Job Machine</span>
          </div>

          <div className="flex-1 max-w-xl">
            <SearchBar onSearch={handleSearch} defaultValue={filters.search} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="btn-ghost text-xs"
            >
              {sidebarOpen ? 'Hide filters' : 'Filters'}
            </button>
            <a
              href="/bookmarks"
              className="btn-ghost text-xs"
            >
              Saved
            </a>
          </div>
        </div>
      </header>

      <StatsBar total={data?.total} isLoading={isLoading} filters={filters} />

      <div className="max-w-screen-2xl mx-auto flex">
        {/* Filter sidebar */}
        {sidebarOpen && (
          <aside className="w-60 shrink-0 border-r border-border-subtle min-h-[calc(100vh-7rem)] sticky top-[7rem] h-fit p-4">
            <FilterSidebar filters={filters} onChange={handleFilterChange} />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4">
          <JobList
            jobs={data?.jobs ?? []}
            total={data?.total ?? 0}
            page={filters.page ?? 1}
            pageSize={filters.pageSize ?? 20}
            isLoading={isLoading}
            isFetching={isFetching}
            bookmarkedIds={bookmarkedIds}
            appliedIds={appliedIds}
            onSelectJob={setSelectedJob}
            onBookmark={toggleBookmark}
            onApplied={toggleApplied}
            onPageChange={handlePageChange}
          />
        </main>

        {/* Job detail panel */}
        {selectedJob && (
          <aside className="w-96 shrink-0 border-l border-border-subtle min-h-[calc(100vh-7rem)] sticky top-[7rem] h-fit overflow-y-auto max-h-[calc(100vh-7rem)]">
            <JobDetailPanel
              job={selectedJob}
              isBookmarked={bookmarkedIds.has(selectedJob.id)}
              isApplied={appliedIds.has(selectedJob.id)}
              onBookmark={() => toggleBookmark(selectedJob.id)}
              onApplied={() => toggleApplied(selectedJob.id)}
              onClose={() => setSelectedJob(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
