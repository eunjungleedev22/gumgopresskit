import './style.css';
import { renderGigs } from './gigs';
import { renderVideos } from './videos';
import { renderMixes } from './soundcloud';
import { renderPressCoverage } from './press-coverage';
import { renderBio } from './bio';

// ── Config ───────────────────────────────────────────────────────────────────
const GIGS_CSV_URL      = import.meta.env.VITE_GIGS_CSV_URL      as string | undefined;
const VIDEOS_CSV_URL    = import.meta.env.VITE_VIDEOS_CSV_URL     as string | undefined;
const MIXES_CSV_URL     = import.meta.env.VITE_MIXES_CSV_URL      as string | undefined;
const PRESS_CSV_URL     = import.meta.env.VITE_PRESS_CSV_URL      as string | undefined;
const BIO_CSV_URL       = import.meta.env.VITE_BIO_CSV_URL        as string | undefined;

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
  // All sections load independently so a slow fetch doesn't block others
  const tasks: Promise<void>[] = [];

  if (BIO_CSV_URL)   tasks.push(renderBio(BIO_CSV_URL));
  if (GIGS_CSV_URL)  tasks.push(renderGigs(GIGS_CSV_URL));
  else {
    const el = document.getElementById('gigs-list');
    if (el) el.innerHTML = `<div class="empty-state">Set VITE_GIGS_CSV_URL in .env — see GOOGLE_SHEETS_GUIDE.md</div>`;
  }
  if (MIXES_CSV_URL)  tasks.push(renderMixes(MIXES_CSV_URL));
  else {
    const el = document.getElementById('mixes-list');
    if (el) el.innerHTML = `<div class="empty-state">Set VITE_MIXES_CSV_URL in .env — see GOOGLE_SHEETS_GUIDE.md</div>`;
  }
  if (VIDEOS_CSV_URL) tasks.push(renderVideos(VIDEOS_CSV_URL));
  else {
    const el = document.getElementById('videos-grid');
    if (el) el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Set VITE_VIDEOS_CSV_URL in .env</div>`;
  }
  if (PRESS_CSV_URL)  tasks.push(renderPressCoverage(PRESS_CSV_URL));

  await Promise.allSettled(tasks);
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
