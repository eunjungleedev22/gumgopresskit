import './style.css';
import { renderGigs } from './gigs';
import { renderVideos } from './videos';
import { renderMixes } from './soundcloud';
import { renderPressCoverage } from './press-coverage';
import { renderBio } from './bio';

// ── Config ───────────────────────────────────────────────────────────────────
const GIGS_CSV_URL   = import.meta.env.VITE_GIGS_CSV_URL   as string | undefined;
const VIDEOS_CSV_URL = import.meta.env.VITE_VIDEOS_CSV_URL  as string | undefined;
const MIXES_CSV_URL  = import.meta.env.VITE_MIXES_CSV_URL   as string | undefined;
const PRESS_CSV_URL  = import.meta.env.VITE_PRESS_CSV_URL   as string | undefined;
const BIO_CSV_URL    = import.meta.env.VITE_BIO_CSV_URL     as string | undefined;

// ── Hero background — uses Vite BASE_URL so dev + prod both work ──────────────
function initHero(): void {
  document.documentElement.style.setProperty(
    '--hero-img-url',
    `url('${import.meta.env.BASE_URL}hero.webp')`
  );
}

// ── Nav: scroll state + mobile toggle ────────────────────────────────────────
function initNav(): void {
  const nav    = document.getElementById('nav')!;
  const toggle = nav.querySelector<HTMLButtonElement>('.nav-toggle')!;
  const links  = nav.querySelector<HTMLUListElement>('.nav-links')!;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
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
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;

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

// ── Reveal on scroll — opacity + translateY 20px → 0 ─────────────────────────
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

// ── Star field — 120 particles, one draw, no RAF loop ────────────────────────
function initStarField(): void {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d')!;

  interface Star { xr: number; yr: number; r: number; a: number; }
  const stars: Star[] = Array.from({ length: 120 }, () => ({
    xr: Math.random(),
    yr: Math.random(),
    r:  Math.random() * 0.75 + 0.2,
    a:  Math.random() * 0.38 + 0.12,
  }));

  function draw() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.xr * canvas.width, s.yr * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,234,240,${s.a})`;
      ctx.fill();
    }
  }

  draw();
  window.addEventListener('resize', draw, { passive: true });
}

// ── Google Sheets data ────────────────────────────────────────────────────────
async function initSheetData(): Promise<void> {
  const tasks: Promise<void>[] = [];

  if (BIO_CSV_URL)    tasks.push(renderBio(BIO_CSV_URL));
  if (GIGS_CSV_URL)   tasks.push(renderGigs(GIGS_CSV_URL));
  else {
    const el = document.getElementById('gigs-list');
    if (el) el.innerHTML = `<div class="empty-state">Set VITE_GIGS_CSV_URL in .env</div>`;
  }
  if (MIXES_CSV_URL)  tasks.push(renderMixes(MIXES_CSV_URL));
  else {
    const el = document.getElementById('mixes-list');
    if (el) el.innerHTML = `<div class="empty-state">Set VITE_MIXES_CSV_URL in .env</div>`;
  }
  if (VIDEOS_CSV_URL) tasks.push(renderVideos(VIDEOS_CSV_URL));
  else {
    const el = document.getElementById('videos-grid');
    if (el) el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">Set VITE_VIDEOS_CSV_URL in .env</div>`;
  }
  if (PRESS_CSV_URL)  tasks.push(renderPressCoverage(PRESS_CSV_URL));

  await Promise.allSettled(tasks);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initStarField();
  initNav();
  initActiveNav();
  initCounters();
  initReveal();
  initSheetData();
});
