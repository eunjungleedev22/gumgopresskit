/**
 * Press tab — expected columns:
 *   url          Article URL                    (required)
 *   publication  Outlet name, e.g. "Groove"     (optional)
 *   date         Date string, e.g. "2026-04"    (optional)
 *   order        Integer sort order, ascending  (optional)
 *
 * Title and a two-sentence summary are fetched from the article's
 * og:title / og:description via the allorigins.win CORS proxy.
 * Falls back gracefully if the proxy or the target site is unreachable.
 */

import { fetchSheet, type Row } from './sheets';

interface PressItem {
  url: string;
  publication: string;
  date: string;
  order: number;
  title: string;
  summary: string;
}

async function fetchMeta(url: string): Promise<{ title: string; summary: string }> {
  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return fallback(url);
    const data = await res.json() as { contents: string };
    const doc = new DOMParser().parseFromString(data.contents ?? '', 'text/html');

    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent ||
      '';

    const rawDesc =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      '';

    const summary = toTwoSentences(rawDesc);
    return { title: title.trim(), summary };
  } catch {
    return fallback(url);
  }
}

function toTwoSentences(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  // Split on sentence-ending punctuation followed by a space or end-of-string
  const sentences = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  return sentences.slice(0, 2).join(' ').trim() || cleaned.slice(0, 220).trim();
}

function fallback(url: string): { title: string; summary: string } {
  try { return { title: new URL(url).hostname.replace(/^www\./, ''), summary: '' }; }
  catch { return { title: url, summary: '' }; }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pressCard(item: PressItem): string {
  const meta = [item.publication, item.date].filter(Boolean).join(' · ');
  return `
    <a class="press-item reveal" href="${escHtml(item.url)}" target="_blank" rel="noopener">
      ${meta ? `<span class="press-meta">${escHtml(meta)}</span>` : ''}
      <span class="press-title">${escHtml(item.title || item.url)}</span>
      ${item.summary ? `<span class="press-summary">${escHtml(item.summary)}</span>` : ''}
      <span class="press-arrow">↗</span>
    </a>`;
}

export async function renderPressCoverage(csvUrl: string): Promise<void> {
  const container = document.getElementById('press-coverage')!;
  const errEl = document.getElementById('press-coverage-error')!;

  try {
    const rows = await fetchSheet(csvUrl);
    const items: PressItem[] = rows
      .filter((r: Row) => r['url'])
      .map((r: Row) => ({
        url: r['url'].trim(),
        publication: r['publication'] ?? '',
        date: r['date'] ?? '',
        order: parseInt(r['order'] ?? '0', 10) || 0,
        title: '',
        summary: '',
      }))
      .sort((a, b) => a.order - b.order);

    if (items.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Render skeleton placeholders immediately
    container.innerHTML = items.map(() => `
      <div class="press-item press-item--loading">
        <div class="skel skel-text skel-text--sm"></div>
        <div class="skel skel-text skel-text--lg"></div>
        <div class="skel skel-text"></div>
      </div>`).join('');

    // Fetch metadata in parallel
    const results = await Promise.allSettled(items.map(item => fetchMeta(item.url)));
    results.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        items[i].title = res.value.title;
        items[i].summary = res.value.summary;
      } else {
        const fb = fallback(items[i].url);
        items[i].title = fb.title;
      }
    });

    container.innerHTML = items.map(pressCard).join('');
  } catch (e) {
    container.innerHTML = '';
    errEl.textContent = `Could not load press. (${e instanceof Error ? e.message : String(e)})`;
    errEl.classList.remove('hidden');
  }
}
