/**
 * Biography language switch.
 *
 * Three bios cannot sit side by side, so they are tabpanels with English
 * showing by default. Built as a real tablist: roving tabindex, arrow keys,
 * aria-selected, so it is usable without a mouse.
 */

import { trackEvent } from './analytics';

/**
 * Which translation to open on. English is the default; a Korean or Chinese
 * browser gets its own.
 *
 * This reads the browser's language preference, not the visitor's location —
 * a static site has no way to know where a request came from, and the
 * preference is the better signal anyway: a Korean speaker abroad still wants
 * Korean. `navigator.languages` is in priority order, so the first match wins.
 */
function preferredLang(available: Set<string>): string {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const base = (tag || '').toLowerCase().split('-')[0];
    // Only Simplified is written, but it still beats English for any Chinese reader
    if ((base === 'ko' || base === 'zh' || base === 'en') && available.has(base)) return base;
  }
  return 'en';
}

export function initLangTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.lang-tab'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-bio-lang]'));
  if (tabs.length === 0 || panels.length === 0) return;

  function show(lang: string, focus = false): void {
    tabs.forEach((tab) => {
      const on = tab.dataset.lang === lang;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.bioLang !== lang; });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset.lang;
      if (!lang || tab.classList.contains('is-active')) return;
      show(lang);
      // Language in the name — three values, and it needs no GA setup to read
      trackEvent(`bio_${lang}`);
    });

    tab.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (step === 0) return;
      e.preventDefault();
      const next = tabs[(i + step + tabs.length) % tabs.length];
      const lang = next.dataset.lang;
      if (lang) show(lang, true);
    });
  });

  // Open on the visitor's own language. No event is sent for this: bio_ko and
  // bio_zh should mean someone chose to switch, not that they arrived.
  const available = new Set(tabs.map((t) => t.dataset.lang ?? '').filter(Boolean));
  const initial = preferredLang(available);
  if (initial !== 'en') show(initial);
}

/** Reveals the venues held back behind the "Show all venues" button. */
export function initVenuesExpand(): void {
  const wrap = document.getElementById('venues');
  const btn = document.getElementById('venues-expand-btn');
  if (!wrap || !btn) return;

  btn.addEventListener('click', () => {
    wrap.classList.remove('is-collapsed');
    btn.remove();
    trackEvent('venues_expand');
  });
}
