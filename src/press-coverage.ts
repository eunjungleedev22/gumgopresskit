/**
 * Press — expected sheet columns:
 *   url          Article URL                     (required)
 *   title        Headline                        (recommended — skips the proxy)
 *   publication  Outlet name, e.g. "Mixmag Asia" (optional)
 *   date         Date string, e.g. "2026-04"     (optional)
 *   summary      Short excerpt                   (optional)
 *   order        Integer sort order, ascending   (optional)
 *
 * With a title in the sheet the item renders immediately. Without one, the
 * headline is fetched through a CORS proxy in the background — parsed in an
 * inert document, tag-stripped, and written back via textContent only.
 */

import { fetchSheet, type Row } from './sheets';
import { escHtml, escAttr, hrefAttr, safeUrl } from './safe';

const metaCache = new Map<string, { title: string; summary: string }>();

interface PressItem {
  url: string;
  publication: string;
  date: string;
  order: number;
  title: string;
  summary: string;
  needsMeta: boolean;
}

/** Strip tags and clamp length — meta values are third-party content. */
function safeText(s: string | null | undefined, maxLen: number): string {
  if (!s) return '';
  return s.replace(/<[^>]*>/g, '').slice(0, maxLen).trim();
}

function hostLabel(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

/** Ceiling on proxied HTML we will buffer and parse, per article. */
const MAX_PROXY_BYTES = 256_000;

/** Never queue more than this many proxy lookups, however long the sheet gets. */
const MAX_PROXY_LOOKUPS = 20;

async function fetchMeta(url: string): Promise<{ title: string; summary: string }> {
  const cached = metaCache.get(url);
  if (cached) return cached;

  const empty = { title: '', summary: '' };

  // Only ever hand an http(s) URL to the proxy
  if (safeUrl(url) === '#') return empty;

  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return empty;

    // The sheet chooses the target URL, so the proxy can be pointed at an
    // arbitrarily large document. Refuse one before buffering it.
    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_PROXY_BYTES) return empty;

    const data = await res.json() as { contents?: unknown };
    const html = typeof data.contents === 'string'
      ? data.contents.slice(0, MAX_PROXY_BYTES)
      : '';

    // Inert parse: no script execution, no subresource loads
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const result = {
      title: safeText(
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
        || doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
        || doc.querySelector('title')?.textContent,
        200,
      ),
      summary: safeText(
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
        || doc.querySelector('meta[name="description"]')?.getAttribute('content'),
        220,
      ),
    };

    metaCache.set(url, result);
    return result;
  } catch {
    return empty;
  }
}

function pressCard(item: PressItem): string {
  const meta = [item.publication, item.date].filter(Boolean).join(' · ');
  return `
    <a class="press-item reveal" href="${hrefAttr(item.url)}"
       target="_blank" rel="noopener noreferrer"
       data-press-url="${escAttr(item.url)}">
      ${meta ? `<span class="press-meta">${escHtml(meta)}</span>` : ''}
      <span class="press-title">${escHtml(item.title || hostLabel(item.url))}</span>
      ${item.summary ? `<span class="press-summary">${escHtml(item.summary)}</span>` : ''}
      <span class="press-arrow" aria-hidden="true">↗</span>
    </a>`;
}

export async function renderPressCoverage(csvUrl: string): Promise<void> {
  const container = document.getElementById('press-coverage');
  if (!container) return;

  try {
    const rows = await fetchSheet(csvUrl);
    const headers = rows[0] ? Object.keys(rows[0]) : [];

    const items: PressItem[] = rows
      .filter((r: Row) => r['url'])
      .map((r: Row) => {
        const title = (r['title'] ?? '').trim();
        return {
          url:         r['url'].trim(),
          publication: r['publication'] ?? '',
          date:        r['date'] ?? '',
          order:       parseInt(r['order'] ?? '0', 10) || 0,
          title,
          summary:     (r['summary'] ?? '').trim(),
          needsMeta:   !title,
        };
      })
      // Drop anything that is not a real http(s) link before it reaches the DOM
      .filter((i) => safeUrl(i.url) !== '#')
      .sort((a, b) => a.order - b.order);

    // Nothing usable — leave the Mixmag entry hard-coded in index.html standing
    if (items.length === 0) {
      const hint = headers.length && !headers.includes('url')
        ? `sheet columns: ${headers.join(', ')} — expected "url"`
        : rows.length === 0 ? 'sheet appears empty' : 'no usable rows';
      console.warn('[press] nothing to render —', hint);
      return;
    }

    container.innerHTML = items.map(pressCard).join('');

    // Background enrichment — two workers so the proxy is not hammered, and a
    // hard queue cap so a long sheet cannot turn each visitor into an amplifier
    const queue = items.filter((i) => i.needsMeta).slice(0, MAX_PROXY_LOOKUPS);
    if (queue.length === 0) return;

    let idx = 0;
    const worker = async () => {
      while (idx < queue.length) {
        const item = queue[idx++];
        try {
          const meta = await fetchMeta(item.url);
          if (!meta.title && !meta.summary) continue;

          const el = container.querySelector<HTMLElement>(
            `[data-press-url="${CSS.escape(item.url)}"]`,
          );
          if (!el) continue;

          const titleEl = el.querySelector('.press-title');
          if (titleEl && meta.title) titleEl.textContent = meta.title;

          if (meta.summary && !el.querySelector('.press-summary')) {
            const span = document.createElement('span');
            span.className = 'press-summary';
            span.textContent = meta.summary;
            el.insertBefore(span, el.querySelector('.press-arrow'));
          }
        } catch { /* individual failures are not worth surfacing */ }
      }
    };

    void Promise.allSettled([worker(), worker()]);
  } catch (e) {
    // Keep whatever is already in the markup — the hard-coded Mixmag entry —
    // rather than clearing the section or showing visitors a red error.
    console.error('[press] failed to load:', e);
  }
}
