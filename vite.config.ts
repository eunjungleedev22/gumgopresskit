import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

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

export default defineConfig({
  base: '/',
  plugins: [biographyDescription()],
  build: {
    // index.html emits no <link rel="modulepreload">, so Vite's polyfill for it
    // was shipping a MutationObserver that watched for tags that never appear.
    modulePreload: { polyfill: false },
    // One entry, no dynamic imports — a manifest and sourcemaps would only add
    // files nobody fetches.
    target: 'es2022',
  },
});
