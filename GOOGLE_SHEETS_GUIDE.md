# Google Sheets Integration Guide

The site pulls live content from **five tabs** of one Google Sheet, published as public
CSV. No backend and no API key — the site stays fully static.

| Tab | Env var | Renders |
|-----|---------|---------|
| Bio | `VITE_BIO_CSV_URL` | Biography section (EN + KR columns) |
| SoundCloud | `VITE_MIXES_CSV_URL` | Mixes grid |
| Videos | `VITE_VIDEOS_CSV_URL` | YouTube grid |
| Press | `VITE_PRESS_CSV_URL` | Press coverage list |
| Gigs | `VITE_GIGS_CSV_URL` | Upcoming section (hidden when empty) |

Header row must be row 1. Header names are lower-cased and trimmed on read, so
`Title` and `title` both work. Unknown columns are ignored.

---

## 1. Bio tab

| Column | Required | Notes |
|--------|----------|-------|
| `lang` | | `en` (default) or `ko` / `kr` / `korean` — picks which column the row fills |
| `topline` | | Bold headline, rendered with the peach marker highlight |
| `description` | | Body copy. A **blank line** starts a new paragraph. |
| `text` | | Used when `description` is absent |

Everything past the first two blocks collapses behind a "Read more" button.

If this tab is empty or fails to load, the copy hard-coded in `index.html` (taken
straight from the 2026 EPK PDF) stays on the page — the section is never blank.

**Example:**

| lang | topline | description |
|------|---------|-------------|
| en | Featured in Mixmag Asia's “Artists Exciting Us in 2026” | From Singapore's dancefloors to clubs across Europe… |
| ko | 2026년 Mixmag Asia 'Artists Exciting Us' 4월 편 소개 | 싱가포르의 플로어에서 출발한 GUMGO는… |

---

## 2. SoundCloud tab

| Column | Required | Notes |
|--------|----------|-------|
| `url` | ✅ | Full track or set URL, e.g. `https://soundcloud.com/gumgo/track-name` |
| `title` | | Overrides the oEmbed title |
| `caption` | | Short description under the card. **Left blank → no caption is shown.** |
| `genre` | | Small uppercase tag |
| `order` | | Integer, ascending |
| `is_highlight` | | `true` → "Featured" badge, sorted to the front |

Title and cover art are fetched from SoundCloud's oEmbed endpoint when `title` is blank.

---

## 3. Videos tab

| Column | Required | Notes |
|--------|----------|-------|
| `url` | ✅ | Full YouTube URL — `watch?v=`, `youtu.be/`, `/embed/` and `/shorts/` all work |
| `title` | | Overrides the oEmbed title |
| `caption` | | Short description under the card |
| `genre` | | Small uppercase tag |
| `order` | | Integer, ascending |
| `is_highlight` | | `true` → "Featured" badge, sorted to the front |

Rows whose URL does not yield a valid 11-character YouTube ID are dropped.

---

## 4. Press tab

| Column | Required | Notes |
|--------|----------|-------|
| `url` | ✅ | Article URL (must be `http(s)`) |
| `title` | | Headline. **Supplying it skips the CORS proxy entirely — recommended.** |
| `publication` | | Outlet name, e.g. `Mixmag Asia` |
| `date` | | e.g. `2026-04` |
| `summary` | | Short excerpt |
| `order` | | Integer, ascending |

When `title` is blank the site fetches the article's `og:title` through
`api.allorigins.win` in the background. Filling `title` in the sheet avoids that
third-party round trip.

---

## 5. Gigs tab

| Column | Required | Notes |
|--------|----------|-------|
| `date` | ✅ | ISO `YYYY-MM-DD`, e.g. `2026-06-14` |
| `venue` | ✅ | Club / venue name |
| `city` | | e.g. `Seoul, South Korea` |
| `ticket_url` | | Full URL. Blank → shows "TBA". |
| `status` | | `upcoming` (default) · `sold_out` · `cancelled` |

Past dates and `cancelled` rows are dropped. **The whole Upcoming section stays
hidden unless at least one gig survives**, so an empty tab costs nothing.

---

## 6. Publish each tab as CSV

1. **File → Share → Publish to web**
2. First dropdown: pick the tab. Second dropdown: **Comma-separated values (.csv)**.
3. **Publish**, then copy the URL:
   ```
   https://docs.google.com/spreadsheets/d/e/SHEET_ID/pub?gid=0&single=true&output=csv
   ```
4. Repeat for each of the five tabs — each has its own `gid`.

> The `gid` appears in the sheet URL when the tab is selected:
> `…/edit#gid=1234567890`

---

## 7. Wire up the env vars

Copy `.env.example` to `.env` (which is git-ignored) and fill in the five URLs:

```bash
cp .env.example .env
npm run dev
```

For deployment, the URLs live in `.github/workflows/deploy.yml` under the build
step's `env:` block. Vite inlines `VITE_*` values into the bundle at build time,
so **these URLs are public** — that is fine, because a published sheet is public
by definition. Never put anything private in these tabs.

---

## 8. Security notes

A few constraints are enforced in code; they are worth knowing before you edit the sheet.

- **Only `docs.google.com` is accepted** as a CSV host (`src/sheets.ts`). Pointing an
  env var anywhere else throws. Google redirects the CSV to
  `*.googleusercontent.com`; the browser follows that hop, which is why the CSP
  allows it.
- **Every value from the sheet is escaped before it reaches the DOM** — text and
  attribute contexts use different escapers (`src/safe.ts`).
- **Link columns are protocol-checked.** `javascript:`, `data:` and `blob:` URLs in
  `url` / `ticket_url` are rejected, so a malicious link in the sheet cannot run script.
- **Sheet responses over 2 MB are rejected mid-stream** to bound memory.
- **Press proxy lookups are capped** at 20 per page load and 256 KB per article, so a
  long sheet cannot turn each visitor into a request amplifier.
- A [Content Security Policy](https://developer.mozilla.org/docs/Web/HTTP/CSP) meta tag
  in `index.html` restricts which origins the page may talk to. **If you add a new data
  source or embed, its origin must be added there or the browser will block it.**

Anyone with edit access to the sheet can change what the site displays — treat sheet
access as equivalent to site-content access.

---

## 9. Keeping data fresh

The site fetches on every page load and respects Google's cache headers, so edits
appear within a few minutes with no rebuild. Push to the deploy branch only when
code or hard-coded copy changes.
