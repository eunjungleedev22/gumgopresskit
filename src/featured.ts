/**
 * Third card in the "Start here" row.
 *
 * The first two are hard-coded because they are the ones that must be on screen
 * the instant the page loads. The third comes from the sheets, so it can be
 * swapped without a deploy: whichever row is flagged is_highlight wins, with a
 * SoundCloud mix preferred over a video.
 *
 * The slot is reserved in the markup and holds a loading state until the sheets
 * answer, so filling it never reflows the two cards beside it.
 */

import { escHtml, escAttr, hrefAttr, srcAttr } from './safe';

export interface FeaturedCandidate {
  provider: 'soundcloud' | 'youtube';
  url: string;
  title: string;
  sub: string;
  thumbUrl: string;
  playerId?: string;
}

/** Already shown as hard-coded cards; never repeat them in the third slot. */
const ALREADY_FEATURED = [
  'soundcloud.com/oslated/oslated-special-mix-097-gumgo',
  'hdx12hh6jfy',
];

function normalise(url: string): string {
  return url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
}

export function isAlreadyFeatured(c: FeaturedCandidate): boolean {
  const key = normalise(c.url);
  const id = (c.playerId ?? '').toLowerCase();
  return ALREADY_FEATURED.some((seen) => key.includes(seen) || (!!id && id === seen));
}

export function renderFeatureSlot(candidate: FeaturedCandidate | null): void {
  const slot = document.getElementById('feature-slot');
  if (!slot) return;

  // Nothing flagged in the sheets — drop the slot so the row is a clean two-up
  if (!candidate) {
    slot.remove();
    return;
  }

  const thumb = srcAttr(candidate.thumbUrl);
  const label = candidate.provider === 'youtube' ? 'Watch' : 'Listen';
  const playerAttrs = candidate.provider === 'youtube'
    ? `data-player="youtube" data-player-id="${escAttr(candidate.playerId ?? '')}"`
    : 'data-player="soundcloud"';

  slot.outerHTML = `
    <a class="feature-card reveal" href="${hrefAttr(candidate.url)}"
       target="_blank" rel="noopener noreferrer"
       ${playerAttrs} data-track="${escAttr(candidate.title)}">
      <div class="feature-media${thumb ? '' : ' feature-media--duotone'}">
        ${thumb ? `<img src="${thumb}" alt="" loading="lazy" decoding="async" />` : ''}
      </div>
      <div class="feature-body">
        <p class="feature-label">${label}${candidate.sub ? ` · ${escHtml(candidate.sub)}` : ''}</p>
        <p class="feature-title">${escHtml(candidate.title)}</p>
      </div>
      <span class="feature-play" aria-hidden="true">&#9654;</span>
    </a>`;
}
