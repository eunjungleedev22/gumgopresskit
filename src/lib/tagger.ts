import type { JobTag, Industry, Seniority } from '@/types/job';

type KeywordMap = Record<string, string[]>;

const TAG_KEYWORDS: KeywordMap = {
  'customer-success': ['customer success', 'customer support', 'account management', 'csm', 'client success', 'client relations', 'onboarding specialist', 'retention'],
  'community': ['community manager', 'community lead', 'community builder', 'discord', 'forum', 'ambassador', 'community growth', 'community engagement'],
  'partnerships': ['partnerships', 'business development', 'biz dev', 'partner manager', 'channel partner', 'alliances', 'strategic partnerships'],
  'growth': ['growth', 'growth hacker', 'growth engineer', 'acquisition', 'retention', 'lifecycle', 'crm', 'funnel', 'conversion'],
  'product': ['product manager', 'product owner', 'product lead', 'product strategy', 'roadmap', 'product design'],
  'operations': ['operations', 'ops manager', 'program manager', 'project manager', 'process improvement', 'biz ops', 'revenue ops'],
  'music': ['music', 'artist', 'label', 'record', 'streaming', 'playlist', 'dj', 'producer', 'sound', 'audio', 'spotify', 'soundcloud', 'bandcamp', 'concert', 'festival', 'tour'],
  'web3': ['web3', 'blockchain', 'crypto', 'defi', 'nft', 'dao', 'smart contract', 'solidity', 'ethereum', 'bitcoin', 'protocol', 'token', 'wallet', 'l2', 'layer 2', 'zk', 'staking'],
  'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'gpt', 'nlp', 'computer vision', 'deep learning', 'generative', 'openai', 'anthropic'],
  'startup': ['startup', 'early stage', 'seed', 'series a', 'series b', 'pre-series', 'venture', 'founding team', 'founding engineer'],
  'engineering': ['engineer', 'developer', 'software', 'backend', 'frontend', 'fullstack', 'devops', 'sre', 'platform', 'infrastructure'],
  'design': ['designer', 'ux', 'ui', 'product design', 'visual design', 'figma', 'motion design', 'brand'],
  'marketing': ['marketing', 'content', 'copywriter', 'seo', 'social media', 'brand marketing', 'performance marketing'],
  'sales': ['sales', 'account executive', 'ae', 'sdr', 'bdr', 'revenue', 'closing'],
  'artist-relations': ['artist relations', 'artist management', 'talent', 'a&r', 'roster', 'artist success'],
  'label': ['record label', 'label manager', 'a&r', 'music publishing', 'licensing'],
  'a&r': ['a&r', 'artist and repertoire', 'scout', 'talent scout', 'signing'],
  'defi': ['defi', 'decentralized finance', 'yield', 'liquidity', 'amm', 'dex', 'lending protocol'],
  'nft': ['nft', 'non-fungible', 'opensea', 'collectible', 'digital art'],
  'dao': ['dao', 'decentralized autonomous', 'governance', 'on-chain voting'],
  'contract': ['contract', 'freelance', 'part-time', 'hourly', 'consultant'],
  'full-time': ['full-time', 'full time', 'permanent', 'salaried'],
};

const REGION_KEYWORDS: Record<string, string[]> = {
  europe: ['europe', 'eu', 'uk', 'germany', 'france', 'netherlands', 'spain', 'sweden', 'berlin', 'amsterdam', 'london', 'paris', 'lisbon', 'barcelona', 'stockholm', 'remote europe'],
  apac: ['apac', 'asia', 'pacific', 'korea', 'japan', 'singapore', 'australia', 'hong kong', 'taiwan', 'thailand', 'vietnam', 'seoul', 'tokyo', 'sydney'],
};

const KOREAN_KEYWORDS = ['korean', 'korea', '한국어', 'hangul', 'bilingual korean', 'korean speaking'];
const VISA_KEYWORDS = ['visa sponsorship', 'visa sponsor', 'work visa', 'relocation', 'work permit', 'h-1b', 'sponsorship available'];

const SENIORITY_MAP: [Seniority, string[]][] = [
  ['ENTRY', ['junior', 'entry level', 'entry-level', 'graduate', 'intern', 'associate', 'trainee', '0-2 years', '1 year']],
  ['SENIOR', ['senior', 'sr.', 'principal', 'staff', '5+ years', '7+ years', '8+ years', '10+ years']],
  ['LEAD', ['lead', 'head of', 'director', 'vp', 'vice president', 'manager']],
  ['EXECUTIVE', ['ceo', 'cto', 'coo', 'cmo', 'chief', 'c-suite', 'founder', 'co-founder']],
];

const INDUSTRY_MAP: [Industry, string[]][] = [
  ['MUSIC', ['music', 'artist', 'record label', 'streaming', 'audio', 'concert', 'festival', 'spotify', 'soundcloud']],
  ['WEB3', ['web3', 'blockchain', 'crypto', 'defi', 'nft', 'dao', 'protocol', 'l2']],
  ['CRYPTO', ['cryptocurrency', 'bitcoin', 'ethereum', 'exchange', 'binance', 'coinbase']],
  ['GAMING', ['gaming', 'game', 'esports', 'metaverse', 'virtual world']],
  ['MEDIA', ['media', 'publishing', 'editorial', 'journalism', 'news']],
  ['FINANCE', ['fintech', 'finance', 'banking', 'payments', 'insurance']],
];

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

export function deriveTags(title: string, description: string, company: string, location: string): JobTag[] {
  const corpus = `${title} ${description} ${company} ${location}`.toLowerCase();
  const tags: Set<JobTag> = new Set();

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => corpus.includes(kw))) {
      tags.add(tag as JobTag);
    }
  }

  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((kw) => corpus.includes(kw))) {
      tags.add(region as JobTag);
    }
  }

  return Array.from(tags);
}

export function deriveKoreanSpeaking(title: string, description: string): boolean {
  const corpus = `${title} ${description}`.toLowerCase();
  return KOREAN_KEYWORDS.some((kw) => corpus.includes(kw));
}

export function deriveVisaSponsorship(description: string): boolean {
  const lower = description.toLowerCase();
  return VISA_KEYWORDS.some((kw) => lower.includes(kw));
}

export function deriveSeniority(title: string, description: string): Seniority {
  const corpus = `${title} ${description}`.toLowerCase();
  for (const [level, keywords] of SENIORITY_MAP) {
    if (keywords.some((kw) => corpus.includes(kw))) return level;
  }
  return 'MID';
}

export function deriveIndustry(title: string, description: string, company: string): Industry {
  const corpus = `${title} ${description} ${company}`.toLowerCase();
  for (const [industry, keywords] of INDUSTRY_MAP) {
    if (keywords.some((kw) => corpus.includes(kw))) return industry;
  }
  return 'TECH';
}

export function deriveRemoteType(location: string, description: string): import('@/types/job').RemoteType {
  const corpus = `${location} ${description}`.toLowerCase();
  if (corpus.includes('remote')) return 'REMOTE';
  if (corpus.includes('hybrid')) return 'HYBRID';
  return 'ONSITE';
}
