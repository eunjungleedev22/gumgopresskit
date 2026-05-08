/**
 * Bio tab — expected columns:
 *   text   Paragraph text (required)
 *   type   "lead" | "body"  (optional — first row defaults to "lead")
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
