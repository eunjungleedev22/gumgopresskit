import { formatDistanceToNow } from 'date-fns';
import type { InlineKeyboardButton } from 'telegraf/types';

export interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  tags: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  postedAt: Date | string;
  remoteType: string;
  visaSponsorship: boolean;
  koreanSpeaking: boolean;
}

// Escape HTML special chars for Telegram HTML parse mode
export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  if (!min && !max) return '';
  const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
  if (min && max) return `${sym}${fmt(min)}–${sym}${fmt(max)}`;
  if (min) return `${sym}${fmt(min)}+`;
  return '';
}

/**
 * Renders one job card as Telegram HTML.
 *
 * Example output:
 *
 *   3/10 ✅
 *
 *   Senior Community Manager
 *   Spotify · Remote (Europe)
 *
 *   🏷 community · music · growth
 *   💰 $80k–$100k
 *   🇰🇷 Korean  🚲 Visa
 *   🕐 2 days ago
 */
export function formatJobCard(
  job: JobData,
  index: number,
  total: number,
  applied: boolean,
): string {
  const tags = job.tags.slice(0, 3).join(' · ');
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);
  const age = formatDistanceToNow(new Date(job.postedAt), { addSuffix: true });

  const badges: string[] = [];
  if (job.koreanSpeaking) badges.push('🇰🇷 Korean');
  if (job.visaSponsorship) badges.push('🚲 Visa');

  const lines: string[] = [
    `<b>${index}/${total}${applied ? ' ✅' : ''}</b>`,
    '',
    `<b>${esc(job.title)}</b>`,
    `${esc(job.company)} · ${esc(job.location)}`,
  ];

  if (tags) lines.push('', `🏷 ${esc(tags)}`);
  if (salary) lines.push(`💰 ${salary}`);
  if (badges.length) lines.push(badges.join('  '));
  lines.push(`🕐 ${age}`);

  return lines.join('\n');
}

/**
 * Inline keyboard for a job card.
 * callback_data encodes jobId + position so we can reconstruct the card on toggle.
 * Format: "apply:{jobId}:{index}:{total}"  (always under 64 bytes — cuid is 25 chars)
 */
export function getJobKeyboard(
  job: JobData,
  applied: boolean,
  index: number,
  total: number,
): InlineKeyboardButton[][] {
  return [[
    { text: '🔗 View Job', url: job.url },
    {
      text: applied ? '✅ Applied!' : '⬜ Applied?',
      callback_data: `apply:${job.id}:${index}:${total}`,
    },
  ]];
}
