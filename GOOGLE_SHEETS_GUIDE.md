# Google Sheets Integration Guide

The website fetches live data from two Google Sheets tabs — one for **Gigs** and one for **Videos**.
No backend required. Sheets are served as public CSV, so the site remains fully static.

---

## 1. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Rename the first tab **Gigs** and add a second tab named **Videos**.

---

## 2. Gigs tab — column structure

Row 1 must be **exactly** these headers (case-sensitive):

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `date` | ISO date `YYYY-MM-DD` | ✅ | e.g. `2026-06-14` |
| `venue` | Text | ✅ | Club / venue name |
| `city` | Text | | e.g. `Seoul, South Korea` |
| `ticket_url` | URL | | Full URL. Leave blank for TBA. |
| `status` | Text | | `upcoming` (default) · `sold_out` · `cancelled` |

**Example rows:**

| date | venue | city | ticket_url | status |
|------|-------|------|------------|--------|
| 2026-06-14 | Fuse | Brussels, Belgium | https://fuse.be/tickets/... | upcoming |
| 2026-07-04 | Fabric | London, UK | | upcoming |
| 2026-05-01 | Club XYZ | Berlin, Germany | | sold_out |

Rules:
- Past dates are automatically hidden by the site.
- Rows with `status = cancelled` are hidden.
- Rows are sorted by date ascending automatically.

---

## 3. Videos tab — column structure

Row 1 must be **exactly** these headers:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `youtube_id` | Text | ✅ | The ID after `?v=` or `youtu.be/` |
| `title` | Text | ✅ | Display title |
| `description` | Text | | Short caption shown under the card |
| `order` | Integer | | Sort order, ascending. Lower = first. |

**How to find a YouTube ID:**
- URL `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`
- URL `https://youtu.be/dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`

**Example rows:**

| youtube_id | title | description | order |
|------------|-------|-------------|-------|
| dQw4w9WgXcQ | GUMGO @ Fabric 2025 | 90 min live recording | 1 |
| xxxxxxxxxxx | GUMGO — Studio Mix Vol. 3 | | 2 |

---

## 4. Publish the Sheet as CSV (no API key needed)

This method makes sheets publicly readable as CSV without any API key.

1. In your Google Sheet, go to **File → Share → Publish to web**.
2. In the first dropdown, select the **Gigs** tab.
3. In the second dropdown, select **Comma-separated values (.csv)**.
4. Click **Publish** and confirm.
5. Copy the URL — it looks like:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID/pub?gid=0&single=true&output=csv
   ```
6. Repeat for the **Videos** tab (different `gid` value).

> **Tip:** The `gid` (tab ID) appears in the sheet URL when you click the tab.
> Example URL: `...spreadsheets/d/SHEET_ID/edit#gid=1234567890`

---

## 5. Alternative: export URL (no publish step)

If you don't want to use "Publish to web", you can use the export URL pattern — but the
sheet must be set to **"Anyone with the link can view"** (Share → General access).

```
https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=GID
```

---

## 6. Add the URLs to your project

Copy `.env.example` to `.env` (never commit `.env`):

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_GIGS_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?gid=0&single=true&output=csv
VITE_VIDEOS_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/pub?gid=1234567890&single=true&output=csv
```

Then run the dev server:

```bash
npm run dev
```

---

## 7. Deployment note

When deploying (Netlify, Vercel, GitHub Pages + Actions, etc.), set the two environment
variables in the platform's dashboard — **not** in the committed code. Vite bakes
`VITE_*` variables into the bundle at build time, so they are not secret, but they
should still be managed via env config to avoid committing sheet URLs to the repo.

---

## 8. Keeping data fresh

The site fetches data on every page load (`cache: 'no-store'`). Since Google Sheets
publishes update within a few minutes, edits show up on the next visitor load with
no rebuild required.

If you want to force a rebuild after editing (e.g. to bust CDN caches), trigger a
deploy from your hosting platform.

---

## 9. Optional: Google Sheets API v4 (private sheets)

If you need private sheets (e.g. sheets not shared publicly), use the
[Google Sheets API v4](https://developers.google.com/sheets/api/guides/concepts):

1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Enable the **Google Sheets API**.
3. Create an **API key** (restrict it to your domain for security).
4. Fetch data with:
   ```
   https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{RANGE}?key={API_KEY}
   ```
   Example range: `Gigs!A:E` (all rows, columns A–E).

The response is JSON with a `values` array. You would replace the CSV fetch in
`src/sheets.ts` with a JSON fetch and map the array rows to objects.

For a fully public presskit this complexity is unnecessary — the CSV approach
(sections 4–6 above) is simpler and has zero API quotas.
