/**
 * Biography — expected sheet columns:
 *   lang        "en" | "ko"  → which column the row fills (default "en")
 *   topline     Bold headline, highlighted
 *   description Body copy; blank lines split paragraphs
 *   text        Fallback body text when `description` is absent
 *
 * When the sheet has no usable rows for a column, the copy hard-coded in
 * index.html (taken from the 2026 EPK PDF) stays as-is.
 */

import { fetchSheet, type Row } from './sheets';
import { escHtml } from './safe';

function paragraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** Escape, then turn single newlines into <br> — order matters. */
function withBreaks(s: string): string {
  return escHtml(s).replace(/\n/g, '<br>');
}

function buildColumn(rows: Row[]): string {
  const parts: string[] = [];

  for (const r of rows) {
    const topline = (r['topline'] ?? '').trim();
    const body    = (r['description'] ?? r['desc'] ?? r['body'] ?? r['content'] ?? r['text'] ?? '').trim();

    if (topline) {
      parts.push(`<p class="bio-lead"><span class="bio-topline marker">${withBreaks(topline)}</span></p>`);
    }
    for (const para of paragraphs(body)) {
      parts.push(`<p>${withBreaks(para)}</p>`);
    }
  }

  return parts.join('');
}

/** Everything past the first two blocks collapses behind a "Read more" button. */
function mount(el: HTMLElement, html: string, label: string): void {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const blocks = Array.from(tpl.content.children);
  if (blocks.length === 0) return;

  const visible   = blocks.slice(0, 2);
  const collapsed = blocks.slice(2);

  el.textContent = '';
  visible.forEach((b) => el.appendChild(b));
  if (collapsed.length === 0) return;

  const box = document.createElement('div');
  box.className = 'bio-collapse';
  collapsed.forEach((b) => box.appendChild(b));

  const btn = document.createElement('button');
  btn.className = 'bio-expand-btn';
  btn.type = 'button';
  btn.textContent = label;
  btn.setAttribute('aria-expanded', 'false');

  btn.addEventListener('click', () => {
    box.classList.add('open');
    btn.remove();
  });

  el.append(box, btn);
}

export async function renderBio(csvUrl: string): Promise<void> {
  const enEl = document.getElementById('bio-en');
  const krEl = document.getElementById('bio-kr');
  if (!enEl && !krEl) return;

  try {
    const rows = await fetchSheet(csvUrl);
    if (rows.length === 0) return;

    const isKorean = (r: Row) => /^(ko|kr|korean|한국어)$/i.test((r['lang'] ?? '').trim());
    const krRows = rows.filter(isKorean);
    const enRows = rows.filter((r) => !isKorean(r));

    const enHtml = buildColumn(enRows);
    const krHtml = buildColumn(krRows);

    if (enEl && enHtml) mount(enEl, enHtml, 'Read more');
    if (krEl && krHtml) mount(krEl, krHtml, '더 읽기');
  } catch (e) {
    // Leave the hard-coded EPK copy in place
    console.error('[bio] failed to load:', e);
  }
}
