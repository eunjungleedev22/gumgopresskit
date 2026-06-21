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

/** Split a <p>...</p> string at its first sentence boundary (". "). */
function splitFirstSentence(paraHtml: string): [string, string] | null {
  const m = paraHtml.match(/^(<p[^>]*>)([\s\S]*?)(<\/p>)$/);
  if (!m) return null;
  const [, open, text, close] = m;
  const idx = text.indexOf('. ');
  if (idx === -1) return null;
  const rest = text.slice(idx + 2).trim();
  return [
    open + text.slice(0, idx + 1) + close,
    rest ? open + rest + close : '',
  ];
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
      if (!topline && !description && text) {
        const isLead = type === 'lead' || parts.length === 0;
        parts.push(isLead
          ? `<p class="about-lead">${escHtml(text)}</p>`
          : `<p>${escHtml(text)}</p>`);
      }
    }

    if (parts.length === 0) return;

    // Visible: topline + first sentence of first body paragraph
    // Collapsed: rest of first paragraph + remaining paragraphs
    let visibleHtml = parts[0];
    const collapsedParts: string[] = [];

    if (parts.length >= 2) {
      const split = splitFirstSentence(parts[1]);
      if (split) {
        visibleHtml += split[0];
        if (split[1]) collapsedParts.push(split[1]);
        collapsedParts.push(...parts.slice(2));
      } else {
        visibleHtml += parts[1];
        collapsedParts.push(...parts.slice(2));
      }
    }

    const collapsedHtml = collapsedParts.join('');
    if (collapsedHtml.trim()) {
      container.innerHTML =
        visibleHtml +
        `<div class="about-body collapsed">${collapsedHtml}</div>` +
        `<button class="bio-expand-btn" aria-expanded="false">— Read more</button>`;

      const btn  = container.querySelector<HTMLButtonElement>('.bio-expand-btn')!;
      const body = container.querySelector<HTMLElement>('.about-body')!;

      btn.addEventListener('click', () => {
        body.style.maxHeight = body.scrollHeight + 'px';
        body.classList.remove('collapsed');
        btn.remove();
      });
    } else {
      container.innerHTML = visibleHtml;
    }
  } catch (e) {
    console.error('[bio] failed to load:', e);
  }
}
