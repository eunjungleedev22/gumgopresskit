import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    // index.html emits no <link rel="modulepreload">, so Vite's polyfill for it
    // was shipping a MutationObserver that watched for tags that never appear.
    modulePreload: { polyfill: false },
    // One entry, no dynamic imports — a manifest and sourcemaps would only add
    // files nobody fetches.
    target: 'es2022',
  },
});
