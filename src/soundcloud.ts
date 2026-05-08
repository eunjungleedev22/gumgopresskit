/**
 * SoundCloud tab — expected columns:
 *   url     SoundCloud track / playlist / set URL  (required)
 *   genre   Genre label shown on card              (optional)
 *   order   Integer sort order, ascending          (optional)
 *
 * Title is fetched live via SoundCloud oEmbed (no API key needed for public tracks).
 * Thumbnail is also pulled from oEmbed when available.
 */

import { fetchSheet, type Row } from './sheets';

interface Mix {
  url: string;
  genre: string;
  order: number;
  title: string;
  thumbUrl: string;
}

async function fetchOEmbed(trackUrl: string): Promise<{ title: string; thumbnail_url: string } | null> {
  try {
    const endpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    return await res.json() as { title: string; thumbnail_url: string };
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

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mixRow(mix: Mix): string {
  const safe = escHtml(mix.url);
  return `
    <div class="mix-row reveal">
      <div class="mix-thumb-wrap">
        ${mix.thumbUrl
          ? `<img class="mix-thumb" src="${escHtml(mix.thumbUrl)}" alt="" loading="lazy" decoding="async" />`
          : `<div class="mix-thumb mix-thumb--empty"></div>`}
      </div>
      <div class="mix-info">
        <div class="mix-title">${escHtml(mix.title)}</div>
        ${mix.genre ? `<span class="mix-genre">${escHtml(mix.genre)}</span>` : ''}
      </div>
      <a class="mix-link" href="${safe}" target="_blank" rel="noopener" aria-label="Play on SoundCloud">Play ↗</a>
    </div>`;
}

export async function renderMixes(csvUrl: string): Promise<void> {
  const list = document.getElementById('mixes-list')!;
  const errEl = document.getElementById('mixes-error')!;

  try {
    const rows = await fetchSheet(csvUrl);
    const mixes: Mix[] = rows
      .filter((r: Row) => r['url'])
      .map((r: Row) => ({
        url: r['url'].trim(),
        genre: r['genre'] ?? '',
        order: parseInt(r['order'] ?? '0', 10) || 0,
        title: '',
        thumbUrl: '',
      }))
      .sort((a, b) => a.order - b.order);

    if (mixes.length === 0) {
      list.innerHTML = `<div class="empty-state">No mixes yet.</div>`;
      return;
    }

    // Render skeleton rows immediately
    list.innerHTML = mixes.map(() => `
      <div class="mix-row mix-row--loading">
        <div class="mix-thumb-wrap"><div class="mix-thumb mix-thumb--empty skel"></div></div>
        <div class="mix-info"><div class="skel skel-text"></div></div>
        <div class="mix-link skel skel-btn"></div>
      </div>`).join('');

    // Fetch oEmbed in parallel
    const results = await Promise.allSettled(mixes.map(m => fetchOEmbed(m.url)));
    results.forEach((res, i) => {
      if (res.status === 'fulfilled' && res.value) {
        mixes[i].title = res.value.title || urlFallbackTitle(mixes[i].url);
        mixes[i].thumbUrl = res.value.thumbnail_url || '';
      } else {
        mixes[i].title = urlFallbackTitle(mixes[i].url);
      }
    });

    list.innerHTML = mixes.map(mixRow).join('');
  } catch (e) {
    list.innerHTML = '';
    errEl.textContent = `Could not load mixes. (${e instanceof Error ? e.message : String(e)})`;
    errEl.classList.remove('hidden');
  }
}
