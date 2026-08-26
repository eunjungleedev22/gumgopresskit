/**
 * One in-app modal for everything embeddable on the page.
 *
 * A new tab is an exit, so anything with a real embed plays here instead:
 * YouTube and SoundCloud both publish players, and both are already allowed by
 * frame-src in the CSP. Anything else — a magazine feature, say — refuses to be
 * framed at its own server, so those links still leave the site and are marked
 * with an arrow rather than a play triangle.
 *
 * Links keep their href. JS only calls preventDefault once it knows it can
 * open the thing, so no-JS visitors, middle-clicks and cmd-clicks all still
 * reach the real page.
 */

import { safeUrl } from './safe';
import { trackEvent } from './analytics';

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

type Shape = 'video' | 'audio';

let modal: HTMLElement | null = null;
let inner: HTMLElement | null = null;
let frame: HTMLElement | null = null;
let lastFocused: HTMLElement | null = null;

function build(): void {
  if (modal) return;

  modal = document.createElement('div');
  modal.className = 'player-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Media player');
  // The close button hangs off the modal, not the frame, so it stays in the
  // corner of the viewport instead of being clipped above a short player.
  modal.innerHTML = `
    <button class="player-close" type="button" aria-label="Close player">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18"/></svg>
    </button>
    <div class="player-inner">
      <div class="player-frame"></div>
    </div>`;

  document.body.appendChild(modal);
  inner = modal.querySelector('.player-inner');
  frame = modal.querySelector('.player-frame');

  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.querySelector('.player-close')!.addEventListener('click', () => close());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) close();
  });
}

export function close(): void {
  if (!modal || !frame) return;
  modal.classList.remove('open');
  frame.textContent = '';                     // tearing out the iframe stops playback
  document.body.classList.remove('modal-open');
  lastFocused?.focus();
  lastFocused = null;
}

function open(iframe: HTMLIFrameElement, shape: Shape): void {
  build();
  if (!modal || !inner || !frame) return;

  lastFocused = document.activeElement as HTMLElement | null;

  inner.className = `player-inner player-inner--${shape}`;
  frame.textContent = '';
  frame.appendChild(iframe);

  modal.classList.add('open');
  document.body.classList.add('modal-open');   // stops the page scrolling behind
  modal.querySelector<HTMLButtonElement>('.player-close')?.focus();
}

/** Returns false when the id is not usable, so the caller can fall back to the link. */
export function openYouTube(id: string): boolean {
  if (!YT_ID.test(id)) return false;

  const f = document.createElement('iframe');
  // playsinline keeps mobile Safari from taking over the whole screen
  f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
  f.allowFullscreen = true;
  f.title = 'YouTube player';
  open(f, 'video');
  return true;
}

export function openSoundCloud(trackUrl: string): boolean {
  const url = safeUrl(trackUrl);
  if (url === '#') return false;

  try {
    if (new URL(url).hostname.replace(/^www\./, '') !== 'soundcloud.com') return false;
  } catch {
    return false;
  }

  const f = document.createElement('iframe');
  f.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url)
    + '&color=%230a0a0a&auto_play=true&hide_related=true&show_comments=false'
    + '&show_user=true&show_reposts=false&show_teaser=false&visual=true';
  f.allow = 'autoplay';
  f.title = 'SoundCloud player';
  open(f, 'audio');
  return true;
}

/** Extract an 11-char video id from any of YouTube's URL shapes. */
export function youtubeId(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;

    const host = u.hostname.replace(/^www\./, '');
    let id: string | null = null;

    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0];
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v')
        ?? (u.pathname.startsWith('/embed/') ? u.pathname.slice(7).split('/')[0] : null)
        ?? (u.pathname.startsWith('/shorts/') ? u.pathname.slice(8).split('/')[0] : null);
    }

    return id && YT_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

/**
 * One delegated listener for the whole page: opens what can be opened in-app,
 * and reports both that and every outbound click to GA.
 */
export function initPlayerLinks(): void {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;

    const mouse = e as MouseEvent;
    // Leave cmd/ctrl/shift-click and middle-click to the browser
    if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey || mouse.button !== 0) return;

    const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
    if (!link) return;

    const label = link.dataset.track
      || link.querySelector('.numbered-title, .card-title, .press-title')?.textContent?.trim()
      || link.textContent?.trim().slice(0, 80)
      || '';

    const kind = link.dataset.player;
    let opened = false;

    if (kind === 'youtube') {
      opened = openYouTube(link.dataset.playerId || youtubeId(link.href) || '');
    } else if (kind === 'soundcloud') {
      opened = openSoundCloud(link.href);
    }

    if (opened) {
      e.preventDefault();
      trackEvent('media_open', {
        provider: kind,
        item_name: label,
        link_url: link.href,
        method: 'in_app',
      });
      return;
    }

    // Not embeddable — it is leaving the site, so at least record it
    let external = false;
    try {
      external = new URL(link.href, location.href).origin !== location.origin;
    } catch { /* mailto: and friends */ }

    if (external) {
      trackEvent('outbound_click', {
        item_name: label,
        link_url: link.href,
        method: link.target === '_blank' ? 'new_tab' : 'same_tab',
      });
    }
  });
}
