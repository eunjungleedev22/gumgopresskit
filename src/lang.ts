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

/** "Français", "Deutsch" — falls back to the raw tag where unsupported. */
function nativeName(tag: string): string {
  try {
    const base = tag.toLowerCase().split('-')[0];
    return new Intl.DisplayNames([tag], { type: 'language' }).of(base) ?? tag;
  } catch {
    return tag;
  }
}

/**
 * Offer machine translation to visitors we have no bio for.
 *
 * A static site cannot translate anything itself: the Google website widget was
 * retired years ago, and the Cloud Translation API needs a key that would be
 * public in this bundle. So this points at the two things that do work — the
 * browser's own translator, and Google's translated view of the page — and says
 * plainly that the result is machine output.
 */
function showTranslationNote(): void {
  const note = document.getElementById('bio-mt-note');
  if (!note) return;

  const tag = browserTag();
  const name = nativeName(tag);
  const target = tag.toLowerCase().split('-')[0];

  const link = document.createElement('a');
  link.href = `https://translate.google.com/translate?sl=en&tl=${encodeURIComponent(target)}&u=${encodeURIComponent(location.href)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open the machine translation';
  link.className = 'bio-mt-link';
  link.addEventListener('click', () => trackEvent('bio_machine_translate', { link_url: link.href }));

  note.textContent = `This biography is not available in ${name}. Your browser can translate the page, or `;
  note.appendChild(link);
  note.appendChild(document.createTextNode(' — machine translated from English, not reviewed.'));
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
  if (!initial) showTranslationNote();
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
