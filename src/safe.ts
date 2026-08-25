/**
 * Escaping / URL-validation helpers for untrusted values.
 *
 * Everything rendered from Google Sheets or third-party oEmbed responses is
 * attacker-controllable in principle — anyone with edit access to the sheet, or
 * a compromised upstream, can put arbitrary strings in these fields. None of it
 * may reach innerHTML unescaped.
 *
 *   escHtml — text-node context; escapes & < >
 *   escAttr — attribute context; also escapes " ' so a value cannot break out
 *             of the quotes and open a new attribute (e.g. `" onerror="…`)
 *   safeUrl — href/src context; rejects javascript:, data:, blob:, everything
 *             that is not http(s)
 */

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape a value interpolated between tags. */
export function escHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ENTITIES[c]);
}

/** Escape a value interpolated inside a quoted attribute. */
export function escAttr(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/**
 * Protocol-check a link target. Returns '#' for anything that is not an
 * absolute http(s) URL — `javascript:alert(1)` in a sheet cell would otherwise
 * execute on click.
 *
 * Parsed with no base on purpose: every URL here comes from a sheet and is
 * meant to be absolute, so a blank or malformed cell must fail rather than
 * quietly resolve against our own origin.
 */
export function safeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '#';
  } catch {
    return '#';
  }
}

/** Same check for image sources; returns '' so callers can render a placeholder. */
export function safeImgUrl(raw: string): string {
  const u = safeUrl(raw);
  return u === '#' ? '' : u;
}

/** Escaped, protocol-checked value ready to drop into href="…". */
export function hrefAttr(raw: string): string {
  return escAttr(safeUrl(raw));
}

/** Escaped, protocol-checked value ready to drop into src="…"; '' when unusable. */
export function srcAttr(raw: string): string {
  const u = safeImgUrl(raw);
  return u ? escAttr(u) : '';
}
