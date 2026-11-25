/**
 * Debut EP snippets.
 *
 * Built from whatever audio sits in src/audio/ep, so with no files there is
 * nothing to render and no empty shell left on the page. Dropping mp3s in is
 * all that is needed to turn the block on; name them "01 Title.mp3" and the
 * number is stripped for display.
 *
 * Progress is an arc drawn with the same stroke as the compass on the plate.
 * There is no bar and no spinner: before a track has its duration there is
 * simply nothing to show yet.
 *
 * One track plays at a time, because two would only fight each other.
 */

import { trackEvent } from './analytics';

const TRACKS = import.meta.glob('./audio/ep/*.{mp3,m4a,ogg}', {
  eager: true, query: '?url', import: 'default',
}) as Record<string, string>;

function titleOf(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file
    .replace(/\.[^.]+$/, '')
    .replace(/^\s*\d+\s*[-._)]?\s*/, '')
    .trim() || file;
}

function clock(seconds: number): string {
  if (!Number.isFinite(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const PLAY = 'M15 11 L27 18 L15 25 Z';
const PAUSE = 'M15 11 H19 V25 H15 Z M21 11 H25 V25 H21 Z';

export function initSnips(): void {
  const block = document.getElementById('ep');
  const list = document.getElementById('snips-list');
  if (!block || !list) return;

  const entries = Object.entries(TRACKS).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return;

  const players: HTMLAudioElement[] = [];

  for (const [path, url] of entries) {
    const title = titleOf(path);

    const li = document.createElement('li');
    li.className = 'snip';
    li.innerHTML = `
      <button class="snip__b" type="button" aria-pressed="false">
        <span class="visually-hidden">Play ${title}</span>
        <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
          <circle class="snip__track" cx="20" cy="20" r="17" />
          <circle class="snip__arc" cx="20" cy="20" r="17" />
          <path class="snip__tri" d="${PLAY}" />
        </svg>
      </button>
      <span class="snip__n"></span>
      <span class="snip__t"></span>`;

    const name = li.querySelector<HTMLElement>('.snip__n');
    if (name) name.textContent = title;

    const button = li.querySelector<HTMLButtonElement>('.snip__b');
    const arc = li.querySelector<SVGCircleElement>('.snip__arc');
    const glyph = li.querySelector<SVGPathElement>('.snip__tri');
    const time = li.querySelector<HTMLElement>('.snip__t');
    if (!button || !arc || !glyph || !time) continue;

    const audio = new Audio(url);
    audio.preload = 'metadata';
    players.push(audio);

    const length = arc.getTotalLength();
    arc.style.setProperty('--arc-len', String(length));

    audio.addEventListener('loadedmetadata', () => {
      time.textContent = clock(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      if (!Number.isFinite(audio.duration) || audio.duration === 0) return;
      const left = length * (1 - audio.currentTime / audio.duration);
      arc.style.strokeDashoffset = String(left);
    });

    const stopped = (): void => {
      button.setAttribute('aria-pressed', 'false');
      glyph.setAttribute('d', PLAY);
    };

    audio.addEventListener('play', () => {
      button.setAttribute('aria-pressed', 'true');
      glyph.setAttribute('d', PAUSE);
    });
    audio.addEventListener('pause', stopped);
    audio.addEventListener('ended', () => {
      stopped();
      arc.style.strokeDashoffset = String(length);
    });

    button.addEventListener('click', () => {
      if (audio.paused) {
        for (const other of players) if (other !== audio) other.pause();
        void audio.play().catch(() => stopped());
        trackEvent('ep_play', { item_name: title });
      } else {
        audio.pause();
      }
    });

    list.appendChild(li);
  }

  block.hidden = false;

  // The masthead's link to the snippets appears on the same condition, so the
  // page never offers a way to something that is not there.
  const link = document.getElementById('ep-link');
  if (link) link.hidden = false;
}
