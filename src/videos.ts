/**
 * Videos — expected sheet columns:
 *   url           YouTube URL (watch?v= or youtu.be/)   (required)
 *   title         Override title                         (optional — falls back to oEmbed)
 *   caption       Short description shown under card     (optional)
 *   genre         Genre tag                              (optional)
 *   order         Integer sort order                     (optional)
 *   is_highlight  "true" → featured card                 (optional)
 */

import { fetchSheet, type Row } from './sheets';

const oEmbedCache = new Map<string, { title: string; thumbnail_url: string }>();

interface Video {
  url: string;
  youtubeId: string;
  title: string;
  caption: string;
  genre: string;
  order: number;
  isHighlight: boolean;
  thumbUrl: string;
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

async function fetchOEmbed(url: string): Promise<{ title: string; thumbnail_url: string } | null> {
  if (oEmbedCache.has(url)) return oEmbedCache.get(url)!;
  try {
    const ep = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const res = await fetch(ep, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;
    const data = await res.json() as { title: string; thumbnail_url: string };
    oEmbedCache.set(url, data);
    return data;
  } catch {
    return null;
  }
}

function urlFallbackTitle(url: string): string {
  const id = extractYoutubeId(url);
  return id ?? url;
}

function trunc(s: string, max = 10): string {
  return s.length <= max ? s : s.slice(0, max).trimEnd() + '…';
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.';

function videoCard(v: Video): string {
  const label   = trunc(v.title, 10);
  const caption = v.caption || LOREM;
  return `
    <div class="mix-card video-card${v.isHighlight ? ' mix-card--hl' : ''} reveal"
         role="button" tabindex="0"
         aria-label="Play: ${escHtml(v.title)}"
         data-ytid="${escHtml(v.youtubeId)}">
      <div class="mix-cover">
        ${v.thumbUrl
          ? `<img src="${escHtml(v.thumbUrl)}" alt="" loading="lazy" decoding="async" />`
          : `<div class="mix-cover__empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="rgba(255,255,255,0.12)"/></svg></div>`}
        <div class="mix-cover__overlay">
          <span class="mix-play">&#9654;</span>
        </div>
        ${v.isHighlight ? '<span class="mix-badge">Featured</span>' : ''}
      </div>
      <div class="mix-meta">
        <div class="mix-label">${escHtml(label)}</div>
        ${v.genre ? `<div class="mix-genre">${escHtml(v.genre)}</div>` : ''}
        <p class="mix-caption">${escHtml(caption)}</p>
      </div>
    </div>`;
}

function buildModal(): void {
  if (document.getElementById('video-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'video-modal';
  modal.className = 'video-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="video-modal-inner">
      <button class="video-modal-close" aria-label="Close video">[ ESC / CLOSE ]</button>
      <div id="video-modal-frame"></div>
    </div>`;
  document.body.appendChild(modal);

  const close = () => {
    modal.classList.remove('open');
    (document.getElementById('video-modal-frame') as HTMLElement).innerHTML = '';
  };

  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.querySelector('.video-modal-close')!.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function openVideo(youtubeId: string): void {
  const modal = document.getElementById('video-modal')!;
  const frame = document.getElementById('video-modal-frame')!;
  frame.innerHTML = `<iframe
    src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0"
    allow="autoplay; encrypted-media; fullscreen"
    allowfullscreen
    title="YouTube video player">
  </iframe>`;
  modal.classList.add('open');
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

function initExpand(container: HTMLElement): void {
  const btn = container.querySelector<HTMLButtonElement>('#videos-expand-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    container.querySelector('.mixes-track')!.classList.remove('collapsed');
    btn.remove();
  });
}

export async function renderVideos(csvUrl: string): Promise<void> {
  const grid  = document.getElementById('videos-grid')!;
  const errEl = document.getElementById('videos-error')!;

  buildModal();

  try {
    const rows = await fetchSheet(csvUrl);
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    console.log('[videos] rows:', rows.length, 'columns:', headers);

    const videos: Video[] = rows
      .filter((r: Row) => r['url'])
      .map((r: Row) => {
        const url = r['url'].trim();
        const youtubeId = extractYoutubeId(url) ?? '';
        return {
          url,
          youtubeId,
          title:       r['title'] ?? '',
          caption:     r['caption'] ?? '',
          genre:       r['genre'] ?? '',
          order:       parseInt(r['order'] ?? '0', 10) || 0,
          isHighlight: (r['is_highlight'] ?? '').trim().toLowerCase() === 'true',
          thumbUrl:    '',
        };
      })
      .filter(v => v.youtubeId)
      .sort((a, b) => (b.isHighlight ? 1 : 0) - (a.isHighlight ? 1 : 0) || a.order - b.order);

    if (videos.length === 0) {
      const hint = headers.length && !headers.includes('url')
        ? `(columns found: ${headers.join(', ')} — expected "url")`
        : rows.length === 0 ? '(sheet appears empty)' : '';
      grid.innerHTML = `<div class="empty-state">No videos yet. ${hint}</div>`;
      return;
    }

    // Fetch oEmbed titles + thumbnails
    const results = await Promise.allSettled(videos.map(v => fetchOEmbed(v.url)));
    results.forEach((res, i) => {
      const oe = res.status === 'fulfilled' ? res.value : null;
      if (!videos[i].title) videos[i].title = oe?.title ?? urlFallbackTitle(videos[i].url);
      // mqdefault (320x180) is always native 16:9 — no letterbox black bars
      videos[i].thumbUrl = videos[i].youtubeId
        ? `https://img.youtube.com/vi/${videos[i].youtubeId}/mqdefault.jpg`
        : '';
    });

    const cards = videos.map(videoCard).join('');
    const showExpand = videos.length > 2;

    grid.innerHTML = `
      <div class="mixes-wrapper" id="videos-carousel">
        <div class="mixes-viewport">
          <div class="mixes-track${showExpand ? ' collapsed' : ''}">${cards}</div>
        </div>
        <div class="mix-carousel-controls">
          <button class="mix-btn mix-btn--prev" aria-label="Previous" disabled>&#8592;</button>
          <button class="mix-btn mix-btn--next" aria-label="Next">&#8594;</button>
        </div>
      </div>
      ${showExpand ? '<button class="mixes-expand-btn" id="videos-expand-btn">Explore more</button>' : ''}`;

    grid.querySelectorAll<HTMLElement>('.video-card').forEach((card) => {
      const ytid = card.dataset.ytid!;
      const play = () => openVideo(ytid);
      card.addEventListener('click', play);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') play(); });
    });

    initCarousel(document.getElementById('videos-carousel')!);
    initExpand(grid);
  } catch (e) {
    grid.innerHTML = '';
    errEl.textContent = `Could not load videos. (${e instanceof Error ? e.message : String(e)})`;
    errEl.classList.remove('hidden');
  }
}
