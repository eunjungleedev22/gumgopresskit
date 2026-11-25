# GUMGO — Electronic Press Kit

Static press kit for DJ and vinyl curator **GUMGO**, live at
[gumgo.art](https://gumgo.art).

---

## What GUMGO still needs to fill

Everything below is the only thing standing between the site and finished. Each
one turns itself on when the file or the value arrives; nothing needs code.

| | Where | What happens when it lands |
|---|---|---|
| **EP snippets** | `src/audio/ep/*.mp3` | The snippets block and the masthead's link to it both appear. With no files, neither is rendered, so the page never offers a way to something that is not there. Name them `01 Title.mp3`; the number is stripped for display. |
| **Press photos** | `src/kit/gumgo-press-photos.zip` | The download row appears in Kit. |
| **Logo** | `src/kit/gumgo-logo.svg` | The download row appears in Kit. |
| **Hero layers** | `public/hero/` | Only needed for the compass animation: a plate **without** the drawn circle and **without** the ruled field, plus the circle on its own transparent layer. The plate as it stands is complete and needs nothing. |
| **Upcoming dates** | The Gigs sheet | The Upcoming section renders only when the sheet holds a date in the future. |

### Biography lengths, for review

All twelve are cut down from the long biography the site carried before, so
nothing in them is invented. Two passages are deliberately **not** carried over
in any language: the one opening *"Press and venue names cannot measure musical
depth"*, and *"under the sun"* in the Barcelona closing line. The digging itself
stays.

The source does not hold 300 words without padding, so the long version runs
short rather than saying less with more. Actual lengths:

| | 50 | 150 | 300 |
|---|---|---|---|
| English | 57 words | 167 | 227 |
| Español | 62 | 184 | 245 |
| Català | 62 | 192 | 258 |
| 简体中文 | 67 chars | 232 | 312 |

They live in `src/bios.ts` and nowhere else.

---

## Design

An early 2000s homepage, and committed to as one: a fixed column centred on a
tiled background, a dark title strip, a dark nav column down the left and a
white page on the right. Black on white, blue underlined links that go purple
when visited, bordered tables with shaded header rows and striped bodies.

**No webfont is requested anywhere.** Verdana, Georgia and Courier New are
installed faces, so there is no flash and nothing render-blocking to wait for.

Nothing on the page is borderline for contrast: black on white is 21:1, the
link blue 8.59:1, white on the nav column 11.6:1.

| Token | Value | Use |
|---|---|---|
| `--page` | `#2f2a24` | behind the frame |
| `--tile` | `#3d3730` | the ruling drawn on it |
| `--sheet` | `#ffffff` | the page itself |
| `--bar` | `#1f1b17` | title strip, section headers |
| `--side` | `#4a423a` | nav column |
| `--head` | `#e4e0d8` | table header cells |
| `--alt` | `#f4f2ee` | every other table row |
| `--link` | `#0033cc` | links, `#551a8b` once visited |
| `--go` | `#9e3a28` | Play and Book only |

Two things are carried from the hero plate rather than invented: the tiled
ground, which lags the scroll at 18% of its speed and is shifted by less than
one tile at a time so no edge of the layer can be exposed, and the one red.

On a phone the nav is an inline list rather than a column, which is the other
way this was done then, and keeps 280px of stacked links from pushing the page
down before a booker reaches anything.

## Stack

- **Vite 8** + **TypeScript 6**, zero runtime dependencies
- **Fonts:** none downloaded
- **Data:** one Google Sheets tab, for Upcoming only (see `GOOGLE_SHEETS_GUIDE.md`).
  Everything else is in the document, so nothing below the hero waits on a fetch.
- **Hosting:** GitHub Pages via `.github/workflows/deploy.yml`

## Develop

```bash
npm install
cp .env.example .env    # VITE_GIGS_CSV_URL is the only one still read
npm run dev
```

```bash
npm run build           # tsc + vite build → dist/
npm run preview         # serve the built output
```

`npm run build` runs `tsc` first, so a type error fails the build.

## Moving to gumgo.xyz

Not done yet, and the order matters: changing `public/CNAME` before the new
domain resolves takes both domains down.

1. Point `gumgo.xyz` at GitHub Pages (four A records on the apex, `www` as a
   CNAME to `eunjungleedev22.github.io`). Confirm the addresses against
   GitHub's own docs rather than any copy of them.
2. Then change `public/CNAME`, and with it the canonical, `og:url`, the two
   JSON-LD `@id`s, `robots.txt` and `sitemap.xml`.
3. Redirect `gumgo.art` from somewhere that holds a certificate for it.
   GitHub only issues one for the domain in `CNAME`, so pointing `gumgo.art`
   at Pages fails the certificate check before the redirect is ever sent.
