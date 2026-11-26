import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
// @ts-expect-error — plain ESM, shared with scripts/writing-sync.mjs
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
 * The build does not go to local body. It reads src/writing.json, which is
 * committed, and that file is refreshed once an hour by .github/workflows/
 * writing.yml running `npm run writing:sync`. One scheduled job is the only
 * thing on this project that ever asks local body for anything, so the rate
 * is a schedule rather than a consequence of how often someone pushes — and
 * a build is hermetic: it cannot be slowed, changed or broken by another
 * site being slow, down or rebuilt.
 *
 * It is not fetched in the visitor's browser either: that would need another
 * origin in the CSP's connect-src, would wait on that origin before showing
 * anything, and would show a crawler that runs no JavaScript nothing at all.
 *
 * A missing or unreadable snapshot fails the build by name rather than
 * shipping a section with a heading and nothing under it.
 */
function writing(): Plugin {
  const TOKEN = '<!--__WRITING__-->';

  return {
    name: 'gumgo-writing',

    transformIndexHtml(html) {
      if (!html.includes(TOKEN)) return html;

      let data;
      try {
        data = JSON.parse(readFileSync('src/writing.json', 'utf8'));
      } catch (error) {
        throw new Error(`src/writing.json could not be read — run npm run writing:sync (${String(error)})`);
      }

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
