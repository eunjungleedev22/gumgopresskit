import './style.css';
import { renderGigs } from './gigs';
import { renderVideos } from './videos';
import { renderMixes } from './soundcloud';
import { renderPressCoverage } from './press-coverage';
import { renderBio } from './bio';
import { initAnalytics } from './analytics';
import { initPlayerLinks } from './player';

// ── Config ───────────────────────────────────────────────────────────────────
const GIGS_CSV_URL   = import.meta.env.VITE_GIGS_CSV_URL   as string | undefined;
const VIDEOS_CSV_URL = import.meta.env.VITE_VIDEOS_CSV_URL as string | undefined;
const MIXES_CSV_URL  = import.meta.env.VITE_MIXES_CSV_URL  as string | undefined;
const PRESS_CSV_URL  = import.meta.env.VITE_PRESS_CSV_URL  as string | undefined;
const BIO_CSV_URL    = import.meta.env.VITE_BIO_CSV_URL    as string | undefined;

// ── Nav ──────────────────────────────────────────────────────────────────────
function initNav(): void {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const toggle = nav.querySelector<HTMLButtonElement>('.nav-toggle');
  const links  = nav.querySelector<HTMLUListElement>('.nav-links');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive: true });

  if (!toggle || !links) return;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}

// ── Active nav link ──────────────────────────────────────────────────────────
function initActiveNav(): void {
  const sections = document.querySelectorAll<HTMLElement>('section[id]');
  const links    = document.querySelectorAll<HTMLAnchorElement>('.nav-links a');
  if (sections.length === 0 || links.length === 0) return;

  const navH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10,
  ) || 52;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: `-${navH}px 0px -62% 0px` });

  sections.forEach((s) => observer.observe(s));
}

// ── Reveal on scroll ─────────────────────────────────────────────────────────
function initReveal(): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.06 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  // Sheet-driven sections mount after first paint — watch for their cards too
  new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.classList.contains('reveal')) observer.observe(node);
        node.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

// ── Google Sheets data ───────────────────────────────────────────────────────
function initSheetData(): void {
  const tasks: Promise<void>[] = [];

  if (BIO_CSV_URL)    tasks.push(renderBio(BIO_CSV_URL));
  if (GIGS_CSV_URL)   tasks.push(renderGigs(GIGS_CSV_URL));
  if (MIXES_CSV_URL)  tasks.push(renderMixes(MIXES_CSV_URL));
  if (PRESS_CSV_URL)  tasks.push(renderPressCoverage(PRESS_CSV_URL));

  if (VIDEOS_CSV_URL) {
    tasks.push(renderVideos(VIDEOS_CSV_URL));
  } else {
    const el = document.getElementById('videos-grid');
    if (el) el.innerHTML = '<div class="empty-state">No videos configured</div>';
  }

  void Promise.allSettled(tasks);
}

// ── Boot ─────────────────────────────────────────────────────────────────────
function boot(): void {
  initAnalytics();
  initPlayerLinks();
  initNav();
  initActiveNav();
  initReveal();
  initSheetData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
