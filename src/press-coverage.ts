/**
 * Press — expected sheet columns:
 *   url          Article URL                          (required)
 *   title        Article headline                     (recommended — skips proxy if provided)
 *   publication  Outlet name, e.g. "Groove"           (optional)
 *   date         Date string, e.g. "2026-04"          (optional)
 *   summary      Short excerpt                        (optional — skips proxy if provided)
 *   order        Integer sort order, ascending        (optional)
 *
 * If title is in the sheet → renders immediately, no proxy needed.
 * If title is absent → tries allorigins.win to fetch og:title (background, non-blocking).
 */

import { fetchSheet, type Row } from './sheets';

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

function safeText(s: string | null | undefined, maxLen: number): string {
  if (!s) return '';
  // Strip any HTML tags that might appear in meta content values
  return s.replace(/<[^>]*>/g, '').slice(0, maxLen).trim();
}

async function fetchMeta(url: string): Promise<{ title: string; summary: string }> {
  if (metaCache.has(url)) return metaCache.get(url)!;
  try {
    // Validate URL before sending to proxy — only http/https allowed
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return fallback(url);

    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return fallback(url);
    const data = await res.json() as { contents: string };

    // Parse in an inert document — scripts don't execute, resources don't load
    const doc = new DOMParser().parseFromString(data.contents ?? '', 'text/html');

    // Read only attribute/text content — never innerHTML
    const title = safeText(
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent,
      200,
    );

    const summary = safeText(
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content'),
      200,
    );

    const result = { title, summary };
    metaCache.set(url, result);
    return result;
  } catch {
    return fallback(url);
  }
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
    <a class="press-item reveal" href="${escHtml(item.url)}" target="_blank" rel="noopener"
       data-press-url="${escHtml(item.url)}">
      ${meta ? `<span class="press-meta">${escHtml(meta)}</span>` : ''}
      <span class="press-title">${escHtml(item.title || fallback(item.url).title)}</span>
      ${item.summary ? `<span class="press-summary">${escHtml(item.summary)}</span>` : ''}
      <span class="press-arrow">↗</span>
    </a>`;
}

export async function renderPressCoverage(csvUrl: string): Promise<void> {
  const container = document.getElementById('press-coverage')!;
  const errEl     = document.getElementById('press-coverage-error')!;

  try {
    const rows = await fetchSheet(csvUrl);
    const headers = rows[0] ? Object.keys(rows[0]) : [];
    console.log('[press] rows:', rows.length, 'columns:', headers);

    const items: PressItem[] = rows
      .filter((r: Row) => r['url'])
      .map((r: Row) => {
        const title   = (r['title']   ?? '').trim();
        const summary = (r['summary'] ?? '').trim();
        return {
          url:         r['url'].trim(),
          publication: r['publication'] ?? '',
          date:        r['date'] ?? '',
          order:       parseInt(r['order'] ?? '0', 10) || 0,
          title,
          summary,
          needsMeta:   !title,
        };
      })
      .sort((a, b) => a.order - b.order);

    if (items.length === 0) {
      const hint = headers.length && !headers.includes('url')
        ? `(columns found: ${headers.join(', ')} — expected "url")`
        : rows.length === 0 ? '(sheet appears empty)' : '';
      container.innerHTML = `<div class="empty-state" style="margin-bottom:32px">No press coverage yet. ${hint}</div>`;
      return;
    }

    // Render immediately with whatever data we have from the sheet
    container.innerHTML = items.map(pressCard).join('');

    // Background: enrich items that have no title via proxy (non-blocking)
    const toEnrich = items.filter(i => i.needsMeta);
    if (toEnrich.length === 0) return;

    // Run proxy fetches with max 2 concurrent to avoid rate-limiting
    let idx = 0;
    const worker = async () => {
      while (idx < toEnrich.length) {
        const item = toEnrich[idx++];
        try {
          const meta = await fetchMeta(item.url);
          if (!meta.title) continue;
          // Patch the already-rendered DOM element in place
          const el = container.querySelector<HTMLElement>(`[data-press-url="${CSS.escape(item.url)}"]`);
          if (!el) continue;
          const titleEl = el.querySelector('.press-title');
          if (titleEl && meta.title) titleEl.textContent = meta.title;
          const summaryEl = el.querySelector('.press-summary');
          if (meta.summary && !summaryEl) {
            const arrow = el.querySelector('.press-arrow');
            const span = document.createElement('span');
            span.className = 'press-summary';
            span.textContent = meta.summary;
            if (arrow) el.insertBefore(span, arrow);
          }
        } catch { /* ignore individual failures */ }
      }
    };
    // Fire and forget — don't await so the section appears instantly
    Promise.all([worker(), worker()]);

  } catch (e) {
    container.innerHTML = '';
    errEl.textContent = `Could not load press. (${e instanceof Error ? e.message : String(e)})`;
    errEl.classList.remove('hidden');
  }
}
