/**
 * Mixes — expected sheet columns:
 *   url           SoundCloud track/set URL  (required)
 *   title         Override title            (optional — falls back to oEmbed)
 *   caption       Short description         (optional)
 *   genre         Genre tag                 (optional)
 *   order         Integer sort order        (optional)
 *   is_highlight  "true" → featured card    (optional)
 */

import { fetchSheet, type Row } from './sheets';
import { escHtml, escAttr, hrefAttr, srcAttr } from './safe';

const oEmbedCache = new Map<string, { title: string; thumbnail_url: string }>();

interface Mix {
  url: string;
  title: string;
  caption: string;
  genre: string;
  order: number;
  isHighlight: boolean;
  thumbUrl: string;
}

/** Coerce an unvalidated JSON field to a string — upstream is not trusted to be well-typed. */
function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

async function fetchOEmbed(trackUrl: string): Promise<{ title: string; thumbnail_url: string } | null> {
  if (oEmbedCache.has(trackUrl)) return oEmbedCache.get(trackUrl)!;
  try {
    const ep = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`;
    const res = await fetch(ep, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;

    const raw = await res.json() as Record<string, unknown>;
    const data = {
      title:         asString(raw?.title),
      thumbnail_url: asString(raw?.thumbnail_url),
    };
    oEmbedCache.set(trackUrl, data);
    return data;
  } catch {
    return null;
  }
}

function urlFallbackTitle(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[parts.length - 1]?.replace(/-/g, ' ') ?? url;
  } catch {
    return url;
  }
}

function waveIcon(): string {
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="10" width="3" height="12" rx="1.5"/><rect x="8" y="6" width="3" height="20" rx="1.5"/><rect x="14" y="3" width="3" height="26" rx="1.5"/><rect x="20" y="8" width="3" height="16" rx="1.5"/><rect x="26" y="12" width="3" height="8" rx="1.5"/></svg>`;
}

function mixCard(mix: Mix): string {
  const thumb = srcAttr(mix.thumbUrl);
  return `
    <a class="card reveal${mix.isHighlight ? ' card--hl' : ''}"
       href="${hrefAttr(mix.url)}" target="_blank" rel="noopener noreferrer"
       aria-label="Listen on SoundCloud: ${escAttr(mix.title)}">
      <div class="card-cover">
        ${thumb
          ? `<img src="${thumb}" alt="" loading="lazy" decoding="async" />`
          : `<div class="card-cover__empty">${waveIcon()}</div>`}
        <span class="card-play" aria-hidden="true">&#9654;</span>
      </div>
      <div class="card-meta">
        ${mix.isHighlight ? '<p class="card-flag">Featured</p>' : ''}
        <p class="card-title">${
          mix.isHighlight
            ? `<span class="marker">${escHtml(mix.title)}</span>`
            : escHtml(mix.title)
        }</p>
        ${mix.genre   ? `<p class="card-genre">${escHtml(mix.genre)}</p>` : ''}
        ${mix.caption ? `<p class="card-caption">${escHtml(mix.caption)}</p>` : ''}
      </div>
    </a>`;
}

export async function renderMixes(csvUrl: string): Promise<void> {
  const list     = document.getElementById('mixes-list');
  const fallback = document.getElementById('mixes-sc-fallback');
  if (!list) return;

  try {
    const rows = await fetchSheet(csvUrl);
    const headers = rows[0] ? Object.keys(rows[0]) : [];

    const mixes: Mix[] = rows
      .filter((r: Row) => r['url'])
      .map((r: Row) => ({
        url:         r['url'].trim(),
        title:       r['title'] ?? '',
        caption:     r['caption'] ?? '',
        genre:       r['genre'] ?? '',
        order:       parseInt(r['order'] ?? '0', 10) || 0,
        isHighlight: (r['is_highlight'] ?? '').trim().toLowerCase() === 'true',
        thumbUrl:    '',
      }))
      .sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0) || a.order - b.order);

    // Nothing usable — stand the full SoundCloud profile in for the grid
    if (mixes.length === 0) {
      const hint = headers.length && !headers.includes('url')
        ? `sheet columns: ${headers.join(', ')} — expected "url"`
        : rows.length === 0 ? 'sheet appears empty' : 'no usable rows';
      console.warn('[mixes] nothing to render —', hint);
      list.innerHTML = '';
      fallback?.classList.remove('hidden');
      return;
    }

    // Cover art only exists in the oEmbed response, so the grid waits for it and
    // the loading state holds until every card can be drawn complete.
    const results = await Promise.allSettled(mixes.map((m) => fetchOEmbed(m.url)));
    results.forEach((res, i) => {
      const oe = res.status === 'fulfilled' ? res.value : null;
      // `||` not `??` — an upstream returning an empty title must still fall back
      if (!mixes[i].title) mixes[i].title = oe?.title || urlFallbackTitle(mixes[i].url);
      mixes[i].thumbUrl = oe?.thumbnail_url ?? '';
    });

    const showExpand = mixes.length > 3;
    list.innerHTML = `
      <div class="media-grid${showExpand ? ' collapsed' : ''}" id="mixes-grid">
        ${mixes.map(mixCard).join('')}
      </div>
      ${showExpand ? '<button class="expand-btn" id="mixes-expand-btn">Show all mixes</button>' : ''}`;

    // The static player is a fallback only; drop it so its lazy iframe never
    // issues a request once the real grid is up.
    fallback?.remove();

    const btn = document.getElementById('mixes-expand-btn');
    btn?.addEventListener('click', () => {
      document.getElementById('mixes-grid')?.classList.remove('collapsed');
      btn.remove();
    });
  } catch (e) {
    // Swap the spinner for the full SoundCloud profile — a working section
    // rather than a red error.
    list.innerHTML = '';
    fallback?.classList.remove('hidden');
    console.error('[mixes] failed to load:', e);
  }
}
