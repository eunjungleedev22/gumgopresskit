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

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  location: string;
  created_at: number;
  tags: string[];
  job_types: string[];
  visa_sponsorship: boolean;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links: { next?: string };
}

export async function fetchArbeitnow(): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = [];
  let url: string | undefined = 'https://www.arbeitnow.com/api/job-board-api';
  let page = 0;
  const maxPages = 5;

  while (url && page < maxPages) {
    try {
      const response = await axios.get<ArbeitnowResponse>(url, { timeout: 15000 });
      const jobs = response.data.data ?? [];

      for (const job of jobs) {
        if (!job.url || !job.title) continue;
        if (!job.remote) continue; // only remote jobs

        const description = job.description ?? '';
        const location = job.location ?? 'Remote';

        results.push({
          externalId: job.slug,
          title: job.title,
          company: job.company_name ?? 'Unknown',
          location,
          remoteType: 'REMOTE',
          url: job.url,
          description,
          tags: deriveTags(job.title, description, job.company_name, location),
          seniority: deriveSeniority(job.title, description),
          visaSponsorship: job.visa_sponsorship ?? deriveVisaSponsorship(description),
          koreanSpeaking: deriveKoreanSpeaking(job.title, description),
          industry: deriveIndustry(job.title, description, job.company_name),
          source: 'ARBEITNOW',
          postedAt: job.created_at ? new Date(job.created_at * 1000) : new Date(),
        });
      }

      url = response.data.links?.next;
      page++;
    } catch (err) {
      console.error(`[Arbeitnow] page ${page} failed`, err);
      break;
    }
  }

  return results;
}
