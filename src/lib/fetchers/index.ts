import { fetchJSearch } from './jsearch';
import { fetchAdzuna } from './adzuna';
import { fetchArbeitnow } from './arbeitnow';
import type { NormalizedJob, Source } from '@/types/job';

export interface FetchResult {
  source: Source;
  jobs: NormalizedJob[];
  error?: string;
}

export async function fetchAllSources(): Promise<FetchResult[]> {
  const results = await Promise.allSettled([
    fetchJSearch().then((jobs) => ({ source: 'JSEARCH' as Source, jobs })),
    fetchAdzuna().then((jobs) => ({ source: 'ADZUNA' as Source, jobs })),
    fetchArbeitnow().then((jobs) => ({ source: 'ARBEITNOW' as Source, jobs })),
  ]);

  return results.map((result) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      source: 'JSEARCH' as Source,
      jobs: [],
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
    };
  });
}
