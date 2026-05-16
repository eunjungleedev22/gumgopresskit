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
      const description = (r['description'] ?? '').trim();
      const text        = (r['text']        ?? '').trim();
      const type        = (r['type']        ?? '').trim();

      if (topline) {
        parts.push(`<p class="about-lead"><strong class="bio-topline">${escHtml(topline)}</strong></p>`);
      }
      if (description) {
        parts.push(`<p>${escHtml(description)}</p>`);
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
      container.innerHTML = parts.join('');
    }
  } catch (e) {
    console.error('[bio] failed to load:', e);
  }
}
