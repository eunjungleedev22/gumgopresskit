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

const QUERIES = [
  'remote customer success',
  'remote community manager',
  'remote music industry',
  'remote web3 community',
  'remote partnerships manager',
  'remote growth operations',
  'remote artist relations',
  'remote korean speaking',
];

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_country: string;
  job_is_remote: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_apply_link: string;
  job_description: string;
  job_employment_type?: string;
  job_posted_at_timestamp?: number;
  job_required_experience?: { required_experience_in_months?: number };
  job_highlights?: { Qualifications?: string[] };
}

function parseSalary(raw: JSearchJob) {
  return {
    salaryMin: raw.job_min_salary ?? undefined,
    salaryMax: raw.job_max_salary ?? undefined,
    salaryCurrency: raw.job_salary_currency ?? 'USD',
  };
}

export async function fetchJSearch(): Promise<NormalizedJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error('RAPIDAPI_KEY not set');

  const results: NormalizedJob[] = [];

  for (const query of QUERIES) {
    try {
      const response = await axios.get<{ data: JSearchJob[] }>(
        'https://jsearch.p.rapidapi.com/search',
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
          },
          params: {
            query,
            num_pages: 2,
            date_posted: 'month',
            remote_jobs_only: true,
          },
          timeout: 15000,
        }
      );

      for (const job of response.data.data ?? []) {
        if (!job.job_apply_link || !job.job_title) continue;

        const description = job.job_description ?? '';
        const location = [job.job_city, job.job_country].filter(Boolean).join(', ');

        results.push({
          externalId: job.job_id,
          title: job.job_title,
          company: job.employer_name ?? 'Unknown',
          location: location || (job.job_is_remote ? 'Remote' : 'Unknown'),
          remoteType: deriveRemoteType(location, description),
          ...parseSalary(job),
          url: job.job_apply_link,
          description,
          tags: deriveTags(job.job_title, description, job.employer_name, location),
          seniority: deriveSeniority(job.job_title, description),
          visaSponsorship: deriveVisaSponsorship(description),
          koreanSpeaking: deriveKoreanSpeaking(job.job_title, description),
          industry: deriveIndustry(job.job_title, description, job.employer_name),
          source: 'JSEARCH',
          postedAt: job.job_posted_at_timestamp
            ? new Date(job.job_posted_at_timestamp * 1000)
            : new Date(),
        });
      }
    } catch (err) {
      console.error(`[JSearch] query failed: ${query}`, err);
    }
  }

  return results;
}
