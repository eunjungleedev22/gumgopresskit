/**
 * Bio — expected sheet columns (any of):
 *   topline     Bold headline (capitalized)
 *   description Body paragraph
 *   text        Fallback body text
 *   type        "lead" | "body"
 */

import { fetchSheet } from './sheets';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

export async function renderBio(csvUrl: string): Promise<void> {
  const container = document.getElementById('bio-text');
  if (!container) return;

  try {
    const rows = await fetchSheet(csvUrl);
    console.log('[bio] rows:', rows.length, 'cols:', rows[0] ? Object.keys(rows[0]) : []);
    if (rows.length === 0) return;

    const parts: string[] = [];

    for (const r of rows) {
      const topline     = (r['topline']     ?? '').trim();
      // Accept common column name variants for body text
      const description = (r['description'] ?? r['desc'] ?? r['body'] ?? r['content'] ?? '').trim();
      const text        = (r['text']        ?? '').trim();
      const type        = (r['type']        ?? '').trim();

      if (topline) {
        parts.push(`<p class="about-lead"><strong class="bio-topline">${escHtml(topline)}</strong></p>`);
      }
      if (description) {
        description.split(/\n{2,}/).forEach((para) => {
          const trimmed = para.trim();
          if (trimmed) parts.push(`<p>${escHtml(trimmed)}</p>`);
        });
      }
      // Legacy fallback column
      if (!topline && !description && text) {
        const isLead = type === 'lead' || parts.length === 0;
        parts.push(isLead
          ? `<p class="about-lead">${escHtml(text)}</p>`
          : `<p>${escHtml(text)}</p>`);
      }
    }

    if (parts.length > 0) {
      if (parts.length <= 2) {
        container.innerHTML = parts.join('');
      } else {
        const bodyHtml = parts.slice(1).join('');
        container.innerHTML =
          parts[0] +
          `<div class="about-body collapsed">${bodyHtml}</div>` +
          `<button class="bio-expand-btn" aria-expanded="false">Read more</button>`;

        const btn  = container.querySelector<HTMLButtonElement>('.bio-expand-btn')!;
        const body = container.querySelector<HTMLElement>('.about-body')!;

        const open = () => {
          body.style.maxHeight = body.scrollHeight + 'px';
          body.classList.remove('collapsed');
          btn.remove();
        };

        btn.addEventListener('click', open);
      }
    }
  } catch (e) {
    console.error('[bio] failed to load:', e);
  }
}
