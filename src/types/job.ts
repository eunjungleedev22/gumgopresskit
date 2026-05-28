export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type Seniority = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
export type Industry = 'TECH' | 'MUSIC' | 'WEB3' | 'CRYPTO' | 'GAMING' | 'MEDIA' | 'FINANCE' | 'EDUCATION' | 'HEALTHCARE' | 'OTHER';
export type Source = 'JSEARCH' | 'ADZUNA' | 'ARBEITNOW';

export type JobTag =
  | 'customer-success'
  | 'community'
  | 'partnerships'
  | 'growth'
  | 'product'
  | 'operations'
  | 'music'
  | 'web3'
  | 'ai'
  | 'startup'
  | 'engineering'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'hr'
  | 'artist-relations'
  | 'label'
  | 'a&r'
  | 'defi'
  | 'nft'
  | 'dao'
  | 'korean'
  | 'europe'
  | 'apac'
  | 'contract'
  | 'full-time';

export interface NormalizedJob {
  externalId?: string;
  title: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  url: string;
  description?: string;
  tags: JobTag[];
  seniority: Seniority;
  visaSponsorship: boolean;
  koreanSpeaking: boolean;
  industry: Industry;
  source: Source;
  postedAt: Date;
}

export interface JobFilters {
  search?: string;
  remoteOnly?: boolean;
  region?: 'europe' | 'apac' | 'global';
  koreanSpeaking?: boolean;
  visaSponsorship?: boolean;
  tags?: JobTag[];
  seniority?: Seniority[];
  industry?: Industry[];
  employmentType?: 'full-time' | 'contract';
  source?: Source[];
  page?: number;
  pageSize?: number;
}

export interface JobWithMeta {
  id: string;
  externalId: string | null;
  title: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  url: string;
  description: string | null;
  tags: string[];
  seniority: Seniority;
  visaSponsorship: boolean;
  koreanSpeaking: boolean;
  industry: Industry;
  source: Source;
  postedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  isBookmarked?: boolean;
  isApplied?: boolean;
}

export interface JobsResponse {
  jobs: JobWithMeta[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
