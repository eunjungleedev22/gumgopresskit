import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
// @ts-expect-error — plain ESM, shared with scripts/writing-sync.mjs
import { fetchWriting } from './scripts/localbody.mjs';
// @ts-expect-error — plain ESM
import { render } from './scripts/writing-render.mjs';

/**
 * The structured data's description is the English 150 word biography.
 *
 * It used to be a copy, pasted in once by hand, and it drifted the first time
 * the biography changed: the page said she produces and the JSON-LD still did
 * not. The placeholder is filled from src/bios.ts at build time instead, so
 * the two cannot disagree again, and a build fails loudly if the biography
 * cannot be found rather than shipping an empty description.
 */
function biographyDescription(): Plugin {
  const TOKEN = '__BIO_EN_150__';

  return {
    name: 'gumgo-biography-description',
    transformIndexHtml(html) {
      if (!html.includes(TOKEN)) return html;

      const src = readFileSync('src/bios.ts', 'utf8');
      const en = src.slice(src.indexOf('  en: {'), src.indexOf('  es: {'));
      // Either quote style, so reformatting bios.ts does not break the build
      const match = /'150':\s*\n?\s*(['"])(.*?)\1,\n/s.exec(en);
      if (!match) throw new Error('bios.ts: could not read the English 150 word biography');

      const text = match[2]
        .replace(/\\n\\n/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      // It lands inside a JSON string, so it is escaped as one
      return html.replace(TOKEN, JSON.stringify(text).slice(1, -1));
    },
  };
}

/**
 * The three most recent pieces she has written at local body.
 *
 * Fetched when the site is built, not in the visitor's browser: a static page
 * that reaches across to another origin on load would need that origin in the
 * CSP's connect-src, would wait on it before showing anything, and would show
 * nothing at all to a crawler that does not run scripts. Pages rebuilds on
 * every push, so the block is as current as the last deploy.
 *
 * If local body is unreachable, or has been rebuilt in a shape the parser does
 * not recognise, the build does not fail — it falls back to src/writing.json,
 * the last good answer, which is committed. `npm run writing:sync` refreshes
 * that file; it is the fallback, not the source.
 */
function writing(): Plugin {
  const TOKEN = '<!--__WRITING__-->';
  let data: unknown;

  return {
    name: 'gumgo-writing',

    async buildStart() {
      try {
        data = await fetchWriting();
      } catch (error) {
        this.warn(`local body unreachable, using src/writing.json — ${String(error)}`);
        data = JSON.parse(readFileSync('src/writing.json', 'utf8'));
      }
    },

    transformIndexHtml(html) {
      if (!html.includes(TOKEN)) return html;
      if (!data) data = JSON.parse(readFileSync('src/writing.json', 'utf8'));
      return html.replace(TOKEN, render(data));
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [biographyDescription(), writing()],
  build: {
    // index.html emits no <link rel="modulepreload">, so Vite's polyfill for it
    // was shipping a MutationObserver that watched for tags that never appear.
    modulePreload: { polyfill: false },
    // One entry, no dynamic imports — a manifest and sourcemaps would only add
    // files nobody fetches.
    target: 'es2022',
  },
});
