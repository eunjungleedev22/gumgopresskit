import './style.css';
import { renderGigs } from './gigs';

const GIGS_CSV_URL = import.meta.env.VITE_GIGS_CSV_URL as string | undefined;

// ── Hero background — BASE_URL-aware so dev + GitHub Pages both work ──────────
function initHero(): void {
  document.documentElement.style.setProperty(
    '--hero-img-url',
    `url('${import.meta.env.BASE_URL}hero.webp')`
  );
}

// ── Nav: mobile toggle ────────────────────────────────────────────────────────
function initNav(): void {
  const nav    = document.getElementById('nav')!;
  const toggle = nav.querySelector<HTMLButtonElement>('.nav-toggle')!;
  const links  = nav.querySelector<HTMLUListElement>('.nav-links')!;

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

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: `-${48}px 0px -60% 0px` });

  sections.forEach((s) => observer.observe(s));
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
  }, { threshold: 0.07 });

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  // Also catch elements added dynamically (gig rows from sheet)
  new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        node.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
        if (node.classList.contains('reveal')) observer.observe(node);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

// ── Performances — only replaces placeholder if sheet URL is configured ───────
async function initPerformances(): Promise<void> {
  if (!GIGS_CSV_URL) return; // keep placeholder HTML as-is
  await renderGigs(GIGS_CSV_URL);
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHero();
  initNav();
  initActiveNav();
  initReveal();
  initPerformances();
});
