/**
 * Renders the Writing block from what the local body writer page gave us.
 *
 * The newest piece gets the picture, because one picture reads and three
 * compete; the two behind it are a title and a line each, which is all a
 * booker scanning the page needs to see that she writes regularly and about
 * what. Everything below those three is a link away, not a longer list.
 *
 * Every value here came off another site, so every one of them is escaped,
 * and the URLs were already checked to be localbody.blog in localbody.mjs.
 */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** "pieces · 29 min" and "25 Nov" are shown as one line. */
const meta = (p) => [p.kind, p.date].filter(Boolean).join(' · ');

function lead(p) {
  const shot = p.img
    ? `<span class="wr-shot"><img src="${esc(p.img)}"${
        p.srcset ? ` srcset="${esc(p.srcset)}"` : ''
      } sizes="(max-width: 719px) calc(100vw - 48px), 560px" alt="" loading="lazy" decoding="async" /></span>`
    : '';

  return `<a class="wr-lead" href="${esc(p.url)}">
                ${shot}
                <span class="wr-meta">${esc(meta(p))}</span>
                <span class="wr-title">${esc(p.title)}</span>
                <span class="wr-dek">${esc(p.dek)}</span>
              </a>`;
}

const row = (p) => `<li><a href="${esc(p.url)}">
                  <span class="wr-meta">${esc(meta(p))}</span>
                  <span class="wr-title">${esc(p.title)}</span>
                  <span class="wr-dek">${esc(p.dek)}</span>
                </a></li>`;

export function render(data) {
  const posts = data.posts.slice(0, 3);
  if (posts.length === 0) throw new Error('writing: nothing to render');

  const bio = (data.bio?.lead ?? []).map((line) => `<span>${esc(line)}</span>`).join('\n                ');
  const rest = posts.slice(1);

  return `<p class="wr-bio">
                ${bio}
              </p>

              ${lead(posts[0])}
${rest.length ? `
              <ul class="wr-list">
                ${rest.map(row).join('\n                ')}
              </ul>
` : ''}
              <p class="wr-more"><a class="btn btn--sm" href="${esc(data.bio?.profile ?? data.source)}">Read more at local body</a></p>`;
}
