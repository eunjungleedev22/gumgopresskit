import axios from 'axios';
import type { NormalizedJob } from '@/types/job';
import {
  deriveTags,
  deriveKoreanSpeaking,
  deriveVisaSponsorship,
  deriveSeniority,
  deriveIndustry,
  deriveRemoteType,
} from '@/lib/tagger';

const COUNTRIES = ['gb', 'de', 'nl', 'us', 'au', 'sg'];
const QUERIES = [
  'remote music jobs',
  'remote web3 jobs',
  'remote community manager',
  'remote customer success',
  'remote partnerships',
  'remote growth',
];

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  redirect_url: string;
  description: string;
  contract_type?: string;
  created: string;
}

export async function fetchAdzuna(): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) throw new Error('ADZUNA credentials not set');

  const results: NormalizedJob[] = [];

  for (const country of COUNTRIES) {
    for (const query of QUERIES) {
      try {
        const response = await axios.get<{ results: AdzunaJob[] }>(
          `https://api.adzuna.com/v1/api/jobs/${country}/search/1`,
          {
            params: {
              app_id: appId,
              app_key: appKey,
              what: query,
              where: 'remote',
              results_per_page: 20,
              sort_by: 'date',
            },
            timeout: 15000,
          }
        );

        for (const job of response.data.results ?? []) {
          if (!job.redirect_url || !job.title) continue;

          const description = job.description ?? '';
          const location = job.location?.display_name ?? 'Remote';

          results.push({
            externalId: job.id,
            title: job.title,
            company: job.company?.display_name ?? 'Unknown',
            location,
            remoteType: deriveRemoteType(location, description),
            salaryMin: job.salary_min,
            salaryMax: job.salary_max,
            salaryCurrency: country === 'gb' ? 'GBP' : country === 'de' || country === 'nl' ? 'EUR' : country === 'au' ? 'AUD' : 'USD',
            url: job.redirect_url,
            description,
            tags: deriveTags(job.title, description, job.company?.display_name ?? '', location),
            seniority: deriveSeniority(job.title, description),
            visaSponsorship: deriveVisaSponsorship(description),
            koreanSpeaking: deriveKoreanSpeaking(job.title, description),
            industry: deriveIndustry(job.title, description, job.company?.display_name ?? ''),
            source: 'ADZUNA',
            postedAt: job.created ? new Date(job.created) : new Date(),
          });
        }
      } catch (err) {
        console.error(`[Adzuna] ${country}/${query} failed`, err);
      }
    }
  }

  return results;
}
