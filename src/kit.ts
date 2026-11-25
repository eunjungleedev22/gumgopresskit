/**
 * Kit: the biography a promoter copies, and the files they download.
 *
 * Three lengths by four languages. The copy button puts plain text on the
 * clipboard, which is what gets pasted into an event listing, and says so for
 * a moment afterwards.
 *
 * The text lives in bios.ts, so the wiring here has nothing to say about it.
 */

import { trackEvent } from './analytics';

import { BIOS, HTML_LANG, LANGS, LENS, type Lang, type Len } from './bios';

function isLang(v: string): v is Lang {
  return (LANGS as string[]).includes(v);
}

/**
 * Pick the opening language from the browser. Catalan, Galician and Basque
 * speakers are offered Castilian rather than English: it is the nearer of the
 * two and this is a Barcelona based artist.
 */
function preferredLang(): Lang {
  for (const raw of navigator.languages ?? [navigator.language]) {
    const tag = (raw || '').toLowerCase();
    if (tag.startsWith('ca')) return 'ca';
    if (tag.startsWith('es') || tag.startsWith('gl') || tag.startsWith('eu')) return 'es';
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}

async function toClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard access is refused outside a secure context and in some
    // embedded browsers. Fall back to a selection the reader can copy.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    area.remove();
    return ok;
  }
}

export function initKit(): void {
  const text = document.getElementById('bio-text');
  const select = document.getElementById('bio-lang') as HTMLSelectElement | null;
  const copy = document.getElementById('bio-copy') as HTMLButtonElement | null;
  const lengthButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.seg__b[data-len]'));
  if (!text || !select || !copy || lengthButtons.length === 0) return;

  let lang: Lang = preferredLang();
  let len: Len = '50';

  select.value = lang;

  const render = (): void => {
    text.textContent = BIOS[lang][len];
    text.setAttribute('lang', HTML_LANG[lang]);
    for (const b of lengthButtons) {
      b.setAttribute('aria-pressed', String(b.dataset.len === len));
    }
  };

  for (const b of lengthButtons) {
    b.addEventListener('click', () => {
      const v = b.dataset.len ?? '';
      if ((LENS as string[]).includes(v)) { len = v as Len; render(); }
    });
  }

  select.addEventListener('change', () => {
    if (isLang(select.value)) { lang = select.value; render(); }
  });

  const label = copy.textContent ?? 'Copy';
  let revert = 0;

  copy.addEventListener('click', () => {
    void (async () => {
      const ok = await toClipboard(BIOS[lang][len]);
      copy.textContent = ok ? 'Copied' : 'Press to select';
      window.clearTimeout(revert);
      revert = window.setTimeout(() => { copy.textContent = label; }, 1800);
      if (ok) trackEvent('bio_copy', { item_name: `${lang}-${len}` });
    })();
  });

  render();
}

/**
 * Downloads. Both blocks stay hidden until the file is actually in the repo,
 * so the kit never offers a link that 404s. Dropping the file into src/kit is
 * all that is needed to turn one on.
 */
export function initKitFiles(): void {
  const files = import.meta.glob('./kit/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

  const show = (blockId: string, linkId: string, match: RegExp): void => {
    const entry = Object.entries(files).find(([path]) => match.test(path));
    if (!entry) return;
    const block = document.getElementById(blockId);
    const link = document.getElementById(linkId) as HTMLAnchorElement | null;
    if (!block || !link) return;
    link.href = entry[1];
    block.hidden = false;
  };

  show('kit-photos', 'kit-photos-link', /\.zip$/i);
  show('kit-logo', 'kit-logo-link', /logo.*\.svg$/i);
}
