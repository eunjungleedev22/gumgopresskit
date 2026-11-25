import './style.css';
import { renderGigs } from './gigs';
import { initPlayerLinks } from './player';
import { initHero } from './hero';
import { initIndex } from './nav';
import { initKit, initKitFiles } from './kit';
import { initSnips } from './snips';

// ── Config ───────────────────────────────────────────────────────────────────
// Upcoming is the only part of the page still fed from the sheet. Everything
// else is in the document, which is why nothing below the hero can shift while
// it loads.
const GIGS_CSV_URL = import.meta.env.VITE_GIGS_CSV_URL as string | undefined;

// ── Boot ─────────────────────────────────────────────────────────────────────
function boot(): void {
  initHero();
  initIndex();
  initPlayerLinks();
  initKit();
  initKitFiles();
  initSnips();

  if (GIGS_CSV_URL) void renderGigs(GIGS_CSV_URL);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
