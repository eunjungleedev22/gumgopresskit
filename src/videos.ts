/**
 * Videos tab — expected sheet columns (row 1 = headers):
 *
 *   youtube_id   YouTube video ID (the part after ?v= or youtu.be/)
 *   title        Display title
 *   description  Short caption (optional)
 *   order        Integer sort order, ascending (optional, default 0)
 *
 * Supports YouTube IDs only. Embed uses youtube-nocookie.com for privacy.
 */

import { fetchSheet, type Row } from './sheets';

interface Video {
  youtubeId: string;
  title: string;
  description: string;
  order: number;
}

function rowToVideo(row: Row): Video | null {
  if (!row['youtube_id'] || !row['title']) return null;
  return {
    youtubeId: row['youtube_id'].trim(),
    title: row['title'],
    description: row['description'] ?? '',
    order: parseInt(row['order'] ?? '0', 10) || 0,
  };
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function playIcon(): string {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z"/></svg>`;
}

function videoCard(v: Video): string {
  const thumb = `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`;
  return `
    <div class="video-card reveal" data-ytid="${escHtml(v.youtubeId)}">
      <div class="video-thumb" role="button" tabindex="0" aria-label="Play ${escHtml(v.title)}">
        <img src="${thumb}" alt="${escHtml(v.title)}" loading="lazy" decoding="async" />
        <div class="video-play">${playIcon()}</div>
      </div>
      <div class="video-meta">
        <div class="video-title">${escHtml(v.title)}</div>
        ${v.description ? `<div class="video-desc">${escHtml(v.description)}</div>` : ''}
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
    const card = track.querySelector<HTMLElement>('.video-card');
    if (!card) return 320;
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
    const videos = rows
      .map(rowToVideo)
      .filter((v): v is Video => v !== null)
      .sort((a, b) => a.order - b.order);

    if (videos.length === 0) {
      grid.innerHTML = `<div class="empty-state">No videos yet. Check back soon.</div>`;
      return;
    }

    const cards = videos.map(videoCard).join('');
    const showExpand = videos.length > 2;

    grid.innerHTML = `
      <div class="mixes-wrapper" id="videos-carousel">
        <div class="mixes-viewport">
          <div class="mixes-track${showExpand ? ' collapsed' : ''}">${cards}</div>
        </div>
        <div class="mix-carousel-controls">
          <button class="mix-btn mix-btn--prev" aria-label="Previous" disabled>←</button>
          <button class="mix-btn mix-btn--next" aria-label="Next">→</button>
        </div>
      </div>
      ${showExpand ? '<button class="mixes-expand-btn" id="videos-expand-btn">Explore more</button>' : ''}`;

    grid.querySelectorAll<HTMLElement>('.video-thumb').forEach((thumb) => {
      const ytid = (thumb.closest('.video-card') as HTMLElement).dataset.ytid!;
      const play = () => openVideo(ytid);
      thumb.addEventListener('click', play);
      thumb.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') play(); });
    });

    initCarousel(document.getElementById('videos-carousel')!);
    initExpand(grid);
  } catch (e) {
    grid.innerHTML = '';
    errEl.textContent = `Could not load videos. (${e instanceof Error ? e.message : String(e)})`;
    errEl.classList.remove('hidden');
  }
}
