/**
 * Thumb index.
 *
 * The tabs are ordinary anchors, so the index works with no JavaScript at all.
 * This only marks which section is being read, with aria-current, which is
 * what the filled tab is keyed on. Nothing here animates on scroll.
 */

export function initIndex(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLAnchorElement>('.index__tab'));
  if (tabs.length === 0) return;

  const byId = new Map<string, HTMLAnchorElement>();
  const targets: HTMLElement[] = [];

  for (const tab of tabs) {
    const id = tab.getAttribute('href')?.slice(1);
    if (!id) continue;
    // Each band and the section it introduces are two elements, so watch the
    // band and the element right after it as one region.
    const band = document.getElementById(id);
    if (!band) continue;
    byId.set(id, tab);
    targets.push(band);
    const body = band.nextElementSibling;
    if (body instanceof HTMLElement) {
      body.dataset.indexFor = id;
      targets.push(body);
    }
  }
  if (targets.length === 0) return;

  const mark = (id: string | null): void => {
    for (const [key, tab] of byId) {
      if (key === id) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    }
  };

  const visible = new Map<HTMLElement, number>();

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (entry.isIntersecting) visible.set(el, entry.intersectionRatio);
      else visible.delete(el);
    }

    // The section with the most of itself on screen wins, so a short band
    // scrolling past never steals the mark from the body it introduces.
    let best: HTMLElement | null = null;
    let bestRatio = 0;
    for (const [el, ratio] of visible) {
      if (ratio > bestRatio) { best = el; bestRatio = ratio; }
    }

    if (!best) { mark(null); return; }
    mark(best.dataset.indexFor ?? best.id ?? null);
  }, { threshold: [0, 0.15, 0.4, 0.75, 1] });

  for (const t of targets) observer.observe(t);
}
