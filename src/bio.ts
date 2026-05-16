/**
 * Bio — expected sheet columns:
 *   topline     Bold headline sentence (rendered as strong lead)
 *   description Body paragraph text
 *
 * Falls back to legacy "text"/"type" columns if topline is absent.
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
    if (rows.length === 0) return;

    const hasNewSchema = rows.some(r => r['topline'] || r['description']);

    if (hasNewSchema) {
      const parts: string[] = [];
      for (const r of rows) {
        const topline     = (r['topline']     ?? '').trim();
        const description = (r['description'] ?? '').trim();
        if (topline)     parts.push(`<p class="about-lead"><strong class="bio-topline">${escHtml(topline)}</strong></p>`);
        if (description) parts.push(`<p>${escHtml(description)}</p>`);
      }
      if (parts.length > 0) container.innerHTML = parts.join('');
      return;
    }

    // Legacy: text + type columns
    const paras = rows
      .map((r, i) => ({ text: (r['text'] ?? Object.values(r)[0] ?? '').trim(), type: r['type'] || (i === 0 ? 'lead' : 'body') }))
      .filter(p => p.text.length > 0);

    if (paras.length === 0) return;
    container.innerHTML = paras
      .map(p => p.type === 'lead'
        ? `<p class="about-lead">${escHtml(p.text)}</p>`
        : `<p>${escHtml(p.text)}</p>`)
      .join('');
  } catch {
    // silently keep the hardcoded fallback
  }
}
