/**
 * Her writing at local body.
 *
 * She writes for localbody.blog as 검은고양이, and the press kit should say so
 * with the three most recent pieces rather than a bare link, because a booker
 * reading a press kit will not open a second site to find out whether she
 * writes at all.
 *
 * The page is server-rendered, so the cards are in the HTML and no browser is
 * needed to read them. There is a site-wide RSS feed at /en/feed.xml, but it
 * holds the last sixty posts from every writer, so a quiet month would drop
 * her out of it entirely. The writer page always holds her own.
 *
 * Everything that comes back is another site's text and goes into ours, so it
 * is escaped on the way in and every URL is checked to be localbody.blog
 * before it is allowed to become an href or a src.
 */

export const ORIGIN = 'https://localbody.blog';
export const SOURCE = `${ORIGIN}/en/writers/gumgo`;

const strip = (s) => s.replace(/<!--.*?-->/gs, '').replace(/<[^>]+>/g, '').trim();

const unescapeHtml = (s) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');

const text = (s) => unescapeHtml(strip(s)).replace(/[ \t]+/g, ' ').trim();

/** Absolute, and only ever to localbody.blog. Anything else is dropped. */
function url(raw) {
  if (!raw) return '';
  const absolute = raw.startsWith('/') ? ORIGIN + raw : raw;
  try {
    const u = new URL(absolute);
    if (u.protocol !== 'https:' || u.hostname !== 'localbody.blog') return '';
    return u.href;
  } catch {
    return '';
  }
}

/** The srcset is a list of those same URLs, so each candidate is checked too. */
function srcset(raw) {
  if (!raw) return '';
  return unescapeHtml(raw)
    .split(',')
    .map((part) => {
      const [u, w] = part.trim().split(/\s+/);
      const safe = url(u);
      return safe && w ? `${safe} ${w}` : '';
    })
    .filter(Boolean)
    .join(', ');
}

export function parse(html) {
  const head = /<p class="mono">(.*?)<\/p><h1 id="editor-title">(.*?)<\/h1><p class="page-lead">(.*?)<\/p>/s.exec(html);
  if (!head) throw new Error('localbody: could not find the writer block');

  const bio = {
    name: text(head[2]),
    // The lead is two sentences on two lines, and reads as two lines.
    lead: unescapeHtml(strip(head[3]))
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
    profile: SOURCE,
  };

  const posts = [];
  for (const card of html.matchAll(/<article class="story story-card[^"]*"[^>]*>(.*?)<\/article>/gs)) {
    const c = card[1];
    const title = /<h2 class="story-title[^"]*"><a href="([^"]+)"[^>]*>(.*?)<\/a><\/h2>/s.exec(c);
    if (!title) continue;
    const href = url(title[1]);
    if (!href) continue;

    const meta = /<p class="pr-meta mono"><span>(.*?)<\/span><time dateTime="([^"]*)"[^>]*>(.*?)<\/time>/s.exec(c);
    const dek = /<p class="story-dek[^"]*">(.*?)<\/p>/s.exec(c);
    const img = /<img src="([^"]+)"(?:[^>]*srcSet="([^"]*)")?/.exec(c);

    posts.push({
      title: text(title[2]),
      url: href,
      dek: dek ? text(dek[1]) : '',
      kind: meta ? text(meta[1]) : '',
      date: meta ? text(meta[3]) : '',
      iso: meta ? meta[2].slice(0, 10) : '',
      img: img ? url(img[1]) : '',
      srcset: img ? srcset(img[2]) : '',
    });
  }

  if (posts.length === 0) throw new Error('localbody: found the writer block but no posts');

  // The page lists them newest first, but it says the date on every card, so
  // there is no reason to take its word for the order.
  posts.sort((a, b) => (a.iso < b.iso ? 1 : a.iso > b.iso ? -1 : 0));

  return { source: SOURCE, fetched: new Date().toISOString().slice(0, 10), bio, posts };
}

/**
 * The build asks for the page the way a browser does.
 *
 * A bare `fetch` sends `user-agent: node` and almost nothing else, which is
 * the shape every edge filter and bot score is tuned to notice. Nothing is
 * blocking us today, but the request that matters runs unattended inside a
 * GitHub Actions runner, from a datacentre range, once per deploy, and the
 * first sign of it being turned away would be the site quietly serving a
 * months-old fallback. A full, ordinary header set is what keeps it boring.
 *
 * It identifies itself at the end of the User-Agent all the same, so that if
 * local body ever wants to allow, rate-limit or simply recognise this, there
 * is a name and a URL to do it by rather than one more anonymous Chrome.
 */
const HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/141.0.0.0 Safari/537.36 gumgo-presskit/1.0 (+https://gumgo.xyz)',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'en-GB,en;q=0.9,ko;q=0.8',
  'cache-control': 'no-cache',
  pragma: 'no-cache',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
};

/**
 * One retry, because a single cold edge miss or a 502 during their deploy is
 * not a reason to serve the fallback for the next however many days. Two
 * attempts and then the fallback; it never blocks a deploy for longer than
 * the two timeouts.
 */
export async function fetchWriting(timeoutMs = 8000, attempts = 2) {
  let last;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(SOURCE, { signal: AbortSignal.timeout(timeoutMs), headers: HEADERS });
      if (!res.ok) throw new Error(`localbody: ${res.status} ${res.statusText}`);
      return parse(await res.text());
    } catch (error) {
      last = error;
    }
  }
  throw last;
}
