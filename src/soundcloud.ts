/**
 * Mixes — expected sheet columns:
 *   url           SoundCloud track/set URL  (required)
 *   title         Override title            (optional — falls back to oEmbed)
 *   caption       Hook text shown above thumbnail on mobile (optional)
 *   genre         Genre tag                 (optional)
 *   order         Integer sort order        (optional)
 *   is_highlight  "true" → featured card    (optional)
 */

import { fetchSheet, type Row } from './sheets';

const oEmbedCache = new Map<string, { title: string; thumbnail_url: string }>();

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.';

interface Mix {
  url: string;
  title: string;
  caption: string;
  genre: string;
  order: number;
  isHighlight: boolean;
  thumbUrl: string;
}

async function fetchOEmbed(trackUrl: string): Promise<{ title: string; thumbnail_url: string } | null> {
  if (oEmbedCache.has(trackUrl)) return oEmbedCache.get(trackUrl)!;
  try {
    const ep = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`;
    const res = await fetch(ep, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;
    const data = await res.json() as { title: string; thumbnail_url: string };
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

function trunc(s: string, max = 10): string {
  return s.length <= max ? s : s.slice(0, max).trimEnd() + '…';
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function waveIcon(): string {
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="10" width="3" height="12" rx="1.5"/><rect x="8" y="6" width="3" height="20" rx="1.5"/><rect x="14" y="3" width="3" height="26" rx="1.5"/><rect x="20" y="8" width="3" height="16" rx="1.5"/><rect x="26" y="12" width="3" height="8" rx="1.5"/></svg>`;
}

function mixCard(mix: Mix): string {
  const label   = trunc(mix.title, 10);
  const caption = mix.caption || LOREM;
  return `
    <a class="mix-card${mix.isHighlight ? ' mix-card--hl' : ''} reveal"
       href="${escHtml(mix.url)}" target="_blank" rel="noopener"
       aria-label="Listen: ${escHtml(mix.title)}">
      <div class="mix-caption-bar">
        <p class="mix-caption-text">${escHtml(caption)}</p>
      </div>
      <div class="mix-cover">
        ${mix.thumbUrl
          ? `<img src="${escHtml(mix.thumbUrl)}" alt="" loading="lazy" decoding="async" />`
          : `<div class="mix-cover__empty">${waveIcon()}</div>`}
        <div class="mix-cover__overlay">
          <span class="mix-play">&#9654;</span>
        </div>
        ${mix.isHighlight ? '<span class="mix-badge">Featured</span>' : ''}
      </div>
      <div class="mix-meta">
        <div class="mix-label">${escHtml(label)}</div>
        ${mix.genre ? `<div class="mix-genre">${escHtml(mix.genre)}</div>` : ''}
      </div>
    </a>`;
}

function initCarousel(wrapper: HTMLElement): void {
  const viewport = wrapper.querySelector<HTMLElement>('.mixes-viewport')!;
  const track    = wrapper.querySelector<HTMLElement>('.mixes-track')!;
  const btnPrev  = wrapper.querySelector<HTMLButtonElement>('.mix-btn--prev')!;
  const btnNext  = wrapper.querySelector<HTMLButtonElement>('.mix-btn--next')!;
  let pos = 0;

  const step = () => {
    const card = track.querySelector<HTMLElement>('.mix-card');
    if (!card) return 240;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    return (card.offsetWidth + gap) * 2;
  };

  const clamp = () => {
    const max = -(track.scrollWidth - viewport.offsetWidth);
    pos = Math.min(0, Math.max(max, pos));
    track.style.transform = `translateX(${pos}px)`;
    btnPrev.disabled = pos >= 0;
    btnNext.disabled = pos <= max + 1;
  };

  btnPrev.addEventListener('click', () => { pos += step(); clamp(); });
  btnNext.addEventListener('click', () => { pos -= step(); clamp(); });

  clamp();
  window.addEventListener('resize', clamp, { passive: true });
}

function initExpand(list: HTMLElement): void {
  const btn = list.querySelector<HTMLButtonElement>('#mixes-expand-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    list.querySelector('.mixes-track')!.classList.remove('collapsed');
    btn.remove();
  });
}

export async function renderMixes(csvUrl: string): Promise<void> {
  const list     = document.getElementById('mixes-list')!;
  const errEl    = document.getElementById('mixes-error')!;
  const fallback = document.getElementById('mixes-sc-fallback') as HTMLElement | null;

  try {
    const rows = await fetchSheet(csvUrl);
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    console.log('[mixes] rows:', rows.length, 'columns:', headers);

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

    if (mixes.length === 0) {
      const hint = headers.length && !headers.includes('url')
        ? `(sheet columns found: ${headers.join(', ')} — expected "url")`
        : rows.length === 0 ? '(sheet appears empty)' : '';
      list.innerHTML = `<div class="empty-state">No mixes yet. ${hint}</div>`;
      return;
    }

    const results = await Promise.allSettled(mixes.map(m => fetchOEmbed(m.url)));
    results.forEach((res, i) => {
      const oe = res.status === 'fulfilled' ? res.value : null;
      if (!mixes[i].title) mixes[i].title = oe?.title ?? urlFallbackTitle(mixes[i].url);
      mixes[i].thumbUrl = oe?.thumbnail_url ?? '';
    });

    const cards = mixes.map(mixCard).join('');
    const showExpand = mixes.length > 2;

    list.innerHTML = `
      <div class="mixes-wrapper" id="mixes-carousel">
        <div class="mixes-viewport">
          <div class="mixes-track${showExpand ? ' collapsed' : ''}">${cards}</div>
        </div>
        <div class="mix-carousel-controls">
          <button class="mix-btn mix-btn--prev" aria-label="Previous" disabled>&#8592;</button>
          <button class="mix-btn mix-btn--next" aria-label="Next">&#8594;</button>
        </div>
      </div>
      ${showExpand ? `<button class="mixes-expand-btn" id="mixes-expand-btn">Explore more</button>` : ''}`;

    if (fallback) fallback.style.display = 'none';
    initCarousel(document.getElementById('mixes-carousel')!);
    initExpand(list);
  } catch (e) {
    list.innerHTML = '';
    errEl.textContent = `Could not load mixes. (${e instanceof Error ? e.message : String(e)})`;
    errEl.classList.remove('hidden');
  }
}
