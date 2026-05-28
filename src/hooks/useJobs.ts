import { useQuery } from '@tanstack/react-query';
import { buildJobsUrl } from '@/lib/utils';
import type { JobFilters, JobsResponse } from '@/types/job';

export function useJobs(filters: JobFilters) {
  const url = buildJobsUrl(filters as Record<string, unknown>);

  return useQuery<JobsResponse>({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
    placeholderData: (prev) => prev,
  });
}
