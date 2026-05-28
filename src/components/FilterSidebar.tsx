'use client';

import type { JobFilters, JobTag, Industry, Seniority } from '@/types/job';
import { cn } from '@/lib/utils';

interface Props {
  filters: JobFilters;
  onChange: (updates: Partial<JobFilters>) => void;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(active ? 'filter-chip-active' : 'filter-chip')}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

const TAGS: { label: string; value: JobTag }[] = [
  { label: 'Customer Success', value: 'customer-success' },
  { label: 'Community', value: 'community' },
  { label: 'Partnerships', value: 'partnerships' },
  { label: 'Growth', value: 'growth' },
  { label: 'Product', value: 'product' },
  { label: 'Operations', value: 'operations' },
  { label: 'Music', value: 'music' },
  { label: 'Web3', value: 'web3' },
  { label: 'AI', value: 'ai' },
  { label: 'Startup', value: 'startup' },
  { label: 'Artist Relations', value: 'artist-relations' },
  { label: 'A&R', value: 'a&r' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Marketing', value: 'marketing' },
];

const SENIORITY: { label: string; value: Seniority }[] = [
  { label: 'Entry', value: 'ENTRY' },
  { label: 'Mid', value: 'MID' },
  { label: 'Senior', value: 'SENIOR' },
  { label: 'Lead', value: 'LEAD' },
];

const INDUSTRIES: { label: string; value: Industry }[] = [
  { label: 'Tech', value: 'TECH' },
  { label: 'Music', value: 'MUSIC' },
  { label: 'Web3', value: 'WEB3' },
  { label: 'Crypto', value: 'CRYPTO' },
  { label: 'Gaming', value: 'GAMING' },
  { label: 'Media', value: 'MEDIA' },
  { label: 'Finance', value: 'FINANCE' },
];

function toggleArray<T>(arr: T[] | undefined, val: T): T[] {
  const existing = arr ?? [];
  return existing.includes(val) ? existing.filter((v) => v !== val) : [...existing, val];
}

export function FilterSidebar({ filters, onChange }: Props) {
  const activeTags = filters.tags ?? [];
  const activeSeniority = filters.seniority ?? [];
  const activeIndustry = filters.industry ?? [];

  const hasActiveFilters =
    filters.remoteOnly ||
    filters.koreanSpeaking ||
    filters.visaSponsorship ||
    filters.region ||
    activeTags.length > 0 ||
    activeSeniority.length > 0 ||
    activeIndustry.length > 0;

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-text-secondary">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={() =>
              onChange({
                remoteOnly: undefined,
                koreanSpeaking: undefined,
                visaSponsorship: undefined,
                region: undefined,
                tags: [],
                seniority: [],
                industry: [],
              })
            }
            className="text-[10px] text-text-muted hover:text-accent-purple transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <Section title="Remote">
        <Chip label="Remote only" active={!!filters.remoteOnly} onClick={() => onChange({ remoteOnly: !filters.remoteOnly })} />
      </Section>

      <Section title="Region">
        <Chip label="Europe" active={filters.region === 'europe'} onClick={() => onChange({ region: filters.region === 'europe' ? undefined : 'europe' })} />
        <Chip label="APAC" active={filters.region === 'apac'} onClick={() => onChange({ region: filters.region === 'apac' ? undefined : 'apac' })} />
        <Chip label="Global" active={filters.region === 'global'} onClick={() => onChange({ region: filters.region === 'global' ? undefined : 'global' })} />
      </Section>

      <Section title="Special">
        <Chip label="Korean speaking" active={!!filters.koreanSpeaking} onClick={() => onChange({ koreanSpeaking: !filters.koreanSpeaking })} />
        <Chip label="Visa sponsorship" active={!!filters.visaSponsorship} onClick={() => onChange({ visaSponsorship: !filters.visaSponsorship })} />
      </Section>

      <Section title="Role type">
        {TAGS.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            active={activeTags.includes(t.value)}
            onClick={() => onChange({ tags: toggleArray(filters.tags, t.value) })}
          />
        ))}
      </Section>

      <Section title="Seniority">
        {SENIORITY.map((s) => (
          <Chip
            key={s.value}
            label={s.label}
            active={activeSeniority.includes(s.value)}
            onClick={() => onChange({ seniority: toggleArray(filters.seniority, s.value) })}
          />
        ))}
      </Section>

      <Section title="Industry">
        {INDUSTRIES.map((i) => (
          <Chip
            key={i.value}
            label={i.label}
            active={activeIndustry.includes(i.value)}
            onClick={() => onChange({ industry: toggleArray(filters.industry, i.value) })}
          />
        ))}
      </Section>

      <Section title="Source">
        <Chip label="JSearch" active={(filters.source ?? []).includes('JSEARCH')} onClick={() => onChange({ source: toggleArray(filters.source, 'JSEARCH') })} />
        <Chip label="Adzuna" active={(filters.source ?? []).includes('ADZUNA')} onClick={() => onChange({ source: toggleArray(filters.source, 'ADZUNA') })} />
        <Chip label="Arbeitnow" active={(filters.source ?? []).includes('ARBEITNOW')} onClick={() => onChange({ source: toggleArray(filters.source, 'ARBEITNOW') })} />
      </Section>
    </div>
  );
}
