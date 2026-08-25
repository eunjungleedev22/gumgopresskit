/**
 * Videos — expected sheet columns:
 *   url           YouTube URL (watch?v= or youtu.be/)   (required)
 *   title         Override title                        (optional — falls back to oEmbed)
 *   caption       Short description                     (optional)
 *   genre         Genre tag                             (optional)
 *   order         Integer sort order                    (optional)
 *   is_highlight  "true" → featured card                (optional)
 */

import { fetchSheet, type Row } from './sheets';
import { escHtml, escAttr, srcAttr } from './safe';
import { openYouTube, youtubeId as extractYoutubeId } from './player';
import { trackEvent } from './analytics';

const oEmbedCache = new Map<string, { title: string; thumbnail_url: string }>();

/** YouTube IDs are [A-Za-z0-9_-]{11}; anything else is rejected outright. */
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

interface Video {
  url: string;
  youtubeId: string;
  title: string;
  caption: string;
  genre: string;
  order: number;
  isHighlight: boolean;
  thumbUrl: string;
  /** false when the title is a stand-in (the id), so oEmbed may replace it */
  titleFromSheet: boolean;
}

/** Coerce an unvalidated JSON field to a string — upstream is not trusted to be well-typed. */
function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

async function fetchOEmbed(url: string): Promise<{ title: string; thumbnail_url: string } | null> {
  if (oEmbedCache.has(url)) return oEmbedCache.get(url)!;
  try {
    const ep = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const res = await fetch(ep, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;

    const raw = await res.json() as Record<string, unknown>;
    const data = {
      title:         asString(raw?.title),
      thumbnail_url: asString(raw?.thumbnail_url),
    };
    oEmbedCache.set(url, data);
    return data;
  } catch {
    return null;
  }
}

function videoCard(v: Video): string {
  const thumb = srcAttr(v.thumbUrl);
  return `
    <div class="card card--video reveal${v.isHighlight ? ' card--hl' : ''}"
         role="button" tabindex="0"
         aria-label="Play video: ${escAttr(v.title)}"
         data-ytid="${escAttr(v.youtubeId)}">
      <div class="card-cover">
        ${thumb
          ? `<img src="${thumb}" data-ytid="${escAttr(v.youtubeId)}" alt="" loading="lazy" decoding="async" />`
          : `<div class="card-cover__empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></div>`}
        <span class="card-play" aria-hidden="true">&#9654;</span>
      </div>
      <div class="card-meta">
        ${v.isHighlight ? '<p class="card-flag">Featured</p>' : ''}
        <p class="card-title">${
          v.isHighlight
            ? `<span class="marker">${escHtml(v.title)}</span>`
            : escHtml(v.title)
        }</p>
        ${v.genre   ? `<p class="card-genre">${escHtml(v.genre)}</p>` : ''}
        ${v.caption ? `<p class="card-caption">${escHtml(v.caption)}</p>` : ''}
      </div>
    </div>`;
}

export async function renderVideos(csvUrl: string): Promise<void> {
  const grid    = document.getElementById('videos-grid');
  const section = document.getElementById('mixes-yt-section');
  if (!grid) return;

  try {
    const rows = await fetchSheet(csvUrl);
    const headers = rows[0] ? Object.keys(rows[0]) : [];

    const videos: Video[] = rows
      .filter((r: Row) => r['url'])
      .map((r: Row) => {
        const url = r['url'].trim();
        return {
          url,
          youtubeId:   extractYoutubeId(url) ?? '',
          title:       r['title'] ?? '',
          caption:     r['caption'] ?? '',
          genre:       r['genre'] ?? '',
          order:       parseInt(r['order'] ?? '0', 10) || 0,
          isHighlight: (r['is_highlight'] ?? '').trim().toLowerCase() === 'true',
          thumbUrl:    '',
          titleFromSheet: !!(r['title'] ?? '').trim(),
        };
      })
      .filter((v) => v.youtubeId)
      .sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0) || a.order - b.order);

    // No videos and no YouTube subsection — better than an empty labelled shell
    if (videos.length === 0) {
      const hint = headers.length && !headers.includes('url')
        ? `sheet columns: ${headers.join(', ')} — expected "url"`
        : rows.length === 0 ? 'sheet appears empty' : 'no usable rows';
      console.warn('[videos] nothing to render —', hint);
      grid.innerHTML = '';
      section?.classList.add('hidden');
      return;
    }

    // A YouTube still is addressable straight from the id, so no request is
    // needed for artwork. Cards crop to a square and the 320px mqdefault would
    // look soft, so ask for maxresdefault and fall back per-image on a 404.
    for (const v of videos) {
      v.thumbUrl = `https://i.ytimg.com/vi/${v.youtubeId}/maxresdefault.jpg`;
    }

    // oEmbed is consulted only for rows the sheet left untitled. With titles in
    // the sheet the grid draws as soon as the CSV lands.
    const untitled = videos.filter((v) => !v.titleFromSheet);
    if (untitled.length > 0) {
      await Promise.allSettled(untitled.map(async (v) => {
        const oe = await fetchOEmbed(v.url);
        if (oe?.title) v.title = oe.title;
      }));
    }
    for (const v of videos) {
      if (!v.title) v.title = v.youtubeId;
    }

    const showExpand = videos.length > 3;
    grid.innerHTML = `
      <div class="media-grid${showExpand ? ' collapsed' : ''}" id="videos-inner-grid">
        ${videos.map(videoCard).join('')}
      </div>
      ${showExpand ? '<button class="expand-btn" id="videos-expand-btn">Show all videos</button>' : ''}`;

    // maxresdefault does not exist for every upload; swap in mqdefault on 404
    grid.querySelectorAll<HTMLImageElement>('.card-cover img[data-ytid]').forEach((img) => {
      img.addEventListener('error', () => {
        const id = img.dataset.ytid;
        if (id && YT_ID.test(id)) img.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
      }, { once: true });
    });

    grid.querySelectorAll<HTMLElement>('.card--video').forEach((card) => {
      const id = card.dataset.ytid ?? '';
      const play = () => {
        if (!openYouTube(id)) return;
        trackEvent('media_open', {
          provider: 'youtube',
          item_name: card.querySelector('.card-title')?.textContent?.trim() ?? '',
          link_url: `https://www.youtube.com/watch?v=${id}`,
          method: 'in_app',
        });
      };
      card.addEventListener('click', play);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
      });
    });

    const btn = document.getElementById('videos-expand-btn');
    btn?.addEventListener('click', () => {
      document.getElementById('videos-inner-grid')?.classList.remove('collapsed');
      btn.remove();
    });
  } catch (e) {
    // Drop the subsection rather than show visitors a red technical error
    grid.innerHTML = '';
    section?.classList.add('hidden');
    console.error('[videos] failed to load:', e);
  }
}
