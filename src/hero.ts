/**
 * The ruled paper, and the one piece of motion the page runs on load.
 *
 * The paper lags the scroll. Because the ruling repeats, it is only ever
 * shifted by less than one square: shifting by the full distance would look
 * identical, so the modulo keeps the transform small, keeps the work on the
 * compositor and makes it impossible to drag an edge of the layer into view.
 *
 * The build is a fade, nothing more. The plate carries the construction and is
 * the page's largest paint, so it is never animated and is there on the first
 * frame. The built page is what the stylesheet describes and the script only
 * adds a class, so no JavaScript, reduced motion and a second page view all
 * give the finished page.
 */

const KEY = 'gumgo:built';

/** Long enough for the last layer at 0.9s plus its 0.4s fade. */
const BUILD_MS = 1400;

/** How far the paper lags the page. 0 would pin it, 1 would scroll it away. */
const LAG = 0.82;

function seenThisSession(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* Storage is unavailable. The fade simply plays again next time. */
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Reads the pitch back off the element, so the stylesheet stays the one source. */
function pitchOf(el: HTMLElement): number {
  const size = getComputedStyle(el).backgroundSize;
  const px = parseFloat(size);
  return Number.isFinite(px) && px > 0 ? px : 0;
}

function initPaper(): void {
  const paper = document.querySelector<HTMLElement>('.paper');
  if (!paper || prefersReducedMotion()) return;

  let pitch = pitchOf(paper);
  if (!pitch) return;

  let queued = false;

  const draw = (): void => {
    queued = false;
    // One square is the whole range worth drawing: beyond it the pattern
    // repeats onto itself.
    const shift = (window.scrollY * (1 - LAG)) % pitch;
    paper.style.transform = `translate3d(0, ${-shift}px, 0)`;
  };

  const schedule = (): void => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(draw);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => {
    pitch = pitchOf(paper) || pitch;
    schedule();
  }, { passive: true });

  draw();
}

function initBuild(): void {
  if (prefersReducedMotion() || seenThisSession()) return;

  remember();
  document.body.classList.add('is-building');
  window.setTimeout(() => document.body.classList.remove('is-building'), BUILD_MS + 200);
}

export function initHero(): void {
  initPaper();
  initBuild();
}
