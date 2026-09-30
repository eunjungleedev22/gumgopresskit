/**
 * Picks the biography language before anything paints.
 *
 * The bundle is a module, so it runs after the document is parsed — which meant
 * a Korean or Spanish visitor saw roughly 300ms of English first. This runs
 * synchronously from <head>, so the right panel is up on the very first frame.
 *
 * Deliberately a separate file rather than an inline <script>: inline would
 * need a CSP hash that silently breaks the page the moment the script changes,
 * while a same-origin file is already covered by script-src 'self'.
 *
 * It only sets an attribute on <html>; the stylesheet decides what that means,
 * and lang.ts removes the attribute once it has taken over. Keep the language
 * list here in step with ALIASES and the tabs in lang.ts.
 */
(function () {
  try {
    var alias = { gl: 'es', eu: 'es' };
    var have = ['en', 'es', 'ca', 'zh', 'ko'];
    var tags = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language];

    for (var i = 0; i < tags.length; i++) {
      var base = String(tags[i] || '').toLowerCase().split('-')[0];
      base = alias[base] || base;
      if (have.indexOf(base) > -1) {
        // English is what the markup already shows, so only the others need marking
        if (base !== 'en') document.documentElement.setAttribute('data-bio', base);
        return;
      }
    }
  } catch (e) {
    /* English stays, and lang.ts will sort it out a moment later */
  }
})();
