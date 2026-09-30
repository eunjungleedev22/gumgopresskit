/**
 * Biography language switch.
 *
 * Five translations cannot sit side by side, so they are tabpanels. A desktop
 * row of tabs reads well; on a phone five of them either wrap into a ragged
 * block or scroll out of sight, so that width gets a native <select> and the
 * platform's own picker. Both controls drive the same state.
 *
 * Visitors whose language is none of the five get English plus a note offering
 * machine translation — labelled as machine translation, because it is.
 */

import { trackEvent } from './analytics';

/**
 * Browser tags best served by a panel written in another language.
 * Galician and Basque readers all read Spanish and the site has no text in
 * either, so Spanish serves them far better than dropping them to English.
 * Catalan has its own panel and so is not aliased.
 */
const ALIASES: Record<string, string> = { gl: 'es', eu: 'es' };

/**
 * Which translation to open on.
 *
 * Reads the browser's language preference, not the visitor's location — a
 * static site cannot know where a request came from, and the preference is the
 * better signal anyway: a Korean speaker abroad still wants Korean.
 * `navigator.languages` is in priority order, so the first match wins.
 *
 * Returns null when nothing matches, which is what triggers the translation note.
 */
function preferredLang(available: Set<string>): string | null {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const base = (tag || '').toLowerCase().split('-')[0];
    const want = ALIASES[base] ?? base;
    // Chinese is written in Simplified only, but it still beats English for any
    // Chinese reader, so zh-TW and zh-HK match too
    if (available.has(want)) return want;
  }
  return null;
}

/** The visitor's own language tag, for the note and the translation link. */
function browserTag(): string {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  return tags[0] || 'en';
}

/** Google serves its translated view from <host-with-dashes>.translate.goog. */
function onTranslatedPage(): boolean {
  return location.hostname.endsWith('.translate.goog');
}

/** The real address, for getting back off the proxy. */
function canonicalUrl(): string {
  return document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href
    ?? 'https://gumgo.art/';
}

function mtLink(text: string, href: string, event: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  a.className = 'bio-mt-link';
  if (href.startsWith('http') && !href.startsWith(canonicalUrl())) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  a.addEventListener('click', () => trackEvent(event, { link_url: href }));
  return a;
}

/**
 * Two states, depending on which side of the translation the reader is on.
 *
 * On the real site, a visitor whose language we have no bio for gets one link.
 * On Google's translated view — where the whole page, this line included, is
 * machine output — it says so and offers the way back. A static site cannot
 * translate in place: the Google website widget was retired and the Cloud
 * Translation API needs a key that would be public in this bundle.
 */
function showTranslationNote(): void {
  const note = document.getElementById('bio-mt-note');
  if (!note) return;
  note.textContent = '';

  if (onTranslatedPage()) {
    note.appendChild(document.createTextNode('Machine translated from English · '));
    note.appendChild(mtLink('See original', canonicalUrl(), 'bio_see_original'));
  } else {
    const target = browserTag().toLowerCase().split('-')[0];
    const href = `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(target)}&u=${encodeURIComponent(location.href)}`;
    note.appendChild(mtLink('Translate this page', href, 'bio_machine_translate'));
  }

  note.classList.remove('hidden');
}

export function initLangTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.lang-tab'));
  const select = document.getElementById('lang-select') as HTMLSelectElement | null;
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
    if (select && select.value !== lang) select.value = lang;
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset.lang;
      if (!lang || tab.classList.contains('is-active')) return;
      show(lang);
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

  select?.addEventListener('change', () => {
    show(select.value);
    trackEvent(`bio_${select.value}`);
  });

  // Open on the visitor's own language. No event is sent for this: bio_es and
  // the rest should mean someone chose to switch, not that they arrived.
  const available = new Set(tabs.map((t) => t.dataset.lang ?? '').filter(Boolean));
  const initial = preferredLang(available);

  if (initial && initial !== 'en') show(initial);
  // lang-boot.js painted this; hand the state over to the hidden attribute
  document.documentElement.removeAttribute('data-bio');

  // Mark the switch as machine output while on the translated view
  if (onTranslatedPage()) document.querySelector('.lang-switch')?.classList.add('is-translated');
  if (!initial || onTranslatedPage()) showTranslationNote();
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
