/**
 * Biography language switch.
 *
 * Three bios cannot sit side by side, so they are tabpanels with English
 * showing by default. Built as a real tablist: roving tabindex, arrow keys,
 * aria-selected, so it is usable without a mouse.
 */

import { trackEvent } from './analytics';

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
      trackEvent('bio_language', { language: lang });
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
}
