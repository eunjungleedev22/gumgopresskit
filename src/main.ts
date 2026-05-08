import './style.css';
import { renderGigs } from './gigs';
import { renderVideos } from './videos';

// ── Config ───────────────────────────────────────────────────────────────────
// Replace these with your published Google Sheets CSV URLs.
// See GOOGLE_SHEETS_GUIDE.md in the repo root for setup instructions.
const GIGS_CSV_URL = import.meta.env.VITE_GIGS_CSV_URL as string | undefined;
const VIDEOS_CSV_URL = import.meta.env.VITE_VIDEOS_CSV_URL as string | undefined;

// ── Nav scroll + mobile toggle ────────────────────────────────────────────────
function initNav(): void {
  const nav = document.getElementById('nav')!;
  const toggle = nav.querySelector<HTMLButtonElement>('.nav-toggle')!;
  const links = nav.querySelector<HTMLUListElement>('.nav-links')!;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('open', !open);
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    });
  });
}

// ── Active nav link on scroll ─────────────────────────────────────────────────
function initActiveNav(): void {
  const sections = document.querySelectorAll<HTMLElement>('section[id]');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-links a');
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 60;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: `-${navH}px 0px -60% 0px` });

  sections.forEach((s) => observer.observe(s));
}

// ── Animated counters ─────────────────────────────────────────────────────────
function initCounters(): void {
  const nums = document.querySelectorAll<HTMLElement>('.stat-num[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      const el = entry.target as HTMLElement;
      const target = parseInt(el.dataset.count!, 10);
      const duration = 1200;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(ease * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  nums.forEach((el) => observer.observe(el));
}

// ── Reveal on scroll ──────────────────────────────────────────────────────────
function initReveal(): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  // Re-observe newly added .reveal elements (for dynamically rendered cards)
  const mutObs = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        node.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
        if (node.classList.contains('reveal')) observer.observe(node);
      });
    });
  });
  mutObs.observe(document.body, { childList: true, subtree: true });
}

// ── Google Sheets data ────────────────────────────────────────────────────────
async function initSheetData(): Promise<void> {
  const gigsEl = document.getElementById('gigs-list');
  const videosEl = document.getElementById('videos-grid');

  if (GIGS_CSV_URL) {
    await renderGigs(GIGS_CSV_URL);
  } else if (gigsEl) {
    gigsEl.innerHTML = renderPlaceholderGigs();
  }

  if (VIDEOS_CSV_URL) {
    await renderVideos(VIDEOS_CSV_URL);
  } else if (videosEl) {
    videosEl.innerHTML = renderPlaceholderVideos();
  }
}

function renderPlaceholderGigs(): string {
  const placeholders = [
    { date: 'TBA', venue: 'Configure VITE_GIGS_CSV_URL', city: 'See GOOGLE_SHEETS_GUIDE.md', ticket: false },
  ];
  return placeholders.map((g) => `
    <div class="gig-row reveal">
      <span class="gig-date">${g.date}</span>
      <div class="gig-info">
        <div class="gig-venue">${g.venue}</div>
        <div class="gig-city">${g.city}</div>
      </div>
      <span class="gig-ticket sold-out">TBA</span>
    </div>`).join('');
}

function renderPlaceholderVideos(): string {
  return `<div class="empty-state" style="grid-column:1/-1">
    Set <code>VITE_VIDEOS_CSV_URL</code> in your <code>.env</code> to load videos from Google Sheets.<br/>
    See <strong>GOOGLE_SHEETS_GUIDE.md</strong> in the repo for full setup.
  </div>`;
}

// ── Cursor dot ────────────────────────────────────────────────────────────────
function initCursor(): void {
  if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch

  const dot = document.createElement('div');
  dot.id = 'cursor-dot';
  document.body.appendChild(dot);

  let cx = 0, cy = 0, tx = 0, ty = 0;
  let raf = 0;

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });

  function loop() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    dot.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
    raf = Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1
      ? requestAnimationFrame(loop)
      : 0;
  }
}

// ── Section label line reveal ─────────────────────────────────────────────────
function initLabelLines(): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('line-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.section-label').forEach((el) => observer.observe(el));
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initActiveNav();
  initCounters();
  initReveal();
  initCursor();
  initLabelLines();
  initSheetData();
});
