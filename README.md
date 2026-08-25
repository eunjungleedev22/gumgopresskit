# GUMGO — Electronic Press Kit

Static press kit for DJ & producer **GUMGO**, live at [gumgo.art](https://gumgo.art).

Vite + TypeScript, no framework, no backend. Content comes from a published Google
Sheet at runtime; the design follows the 2026 EPK print layout — white paper,
hairline rules, Inter + Noto Sans KR, inverted black chips.

## Stack

- **Vite 8** + **TypeScript 6**, zero runtime dependencies
- **Fonts:** [Inter](https://fonts.google.com/specimen/Inter) and
  [Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR) — both SIL OFL
- **Data:** five Google Sheets tabs published as CSV (see `GOOGLE_SHEETS_GUIDE.md`)
- **Hosting:** GitHub Pages via `.github/workflows/deploy.yml`

## Develop

```bash
npm install
cp .env.example .env    # fill in the five sheet CSV URLs
npm run dev
```

```bash
npm run build           # tsc + vite build → dist/
npm run preview         # serve the built output
```

`npm run build` runs `tsc` first, so a type error fails the build.

## Layout

Responsive column model, applied consistently across venues, mixes, videos and press:

| Breakpoint | Width | Columns |
|------------|-------|---------|
| Mobile | `< 640px` | 1 |
| Tablet | `>= 640px` | 2 |
| Desktop | `>= 1024px` | 3 |

The masthead and the two-up text blocks (bio EN/KR, press, contact) switch to
side-by-side at `768px`.

## Source map

| File | Role |
|------|------|
| `index.html` | Page structure, CSP, critical CSS, hard-coded EPK copy |
| `src/style.css` | Whole design system — tokens, grids, components |
| `src/main.ts` | Boot: analytics, nav, scroll reveal, sheet dispatch |
| `src/safe.ts` | Escaping and URL validation for untrusted values |
| `src/sheets.ts` | CSV fetch (host-allowlisted) + parser |
| `src/bio.ts` · `soundcloud.ts` · `videos.ts` · `press-coverage.ts` · `gigs.ts` | Per-section renderers |

## Editing content

Most copy is edited in the Google Sheet, not in this repo — see
**[`GOOGLE_SHEETS_GUIDE.md`](./GOOGLE_SHEETS_GUIDE.md)** for every tab's columns and
the security constraints on sheet values.

The masthead, venue list, highlights and the biography fallback are hard-coded in
`index.html` because they change rarely and must render before any fetch resolves.
