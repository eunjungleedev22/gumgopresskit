/**
 * Google Analytics wiring.
 *
 * The bootstrap lives here rather than as an inline <script> in index.html so
 * the CSP can keep script-src at 'self' with no 'unsafe-inline'. The gtag.js
 * loader tag stays in the markup.
 *
 * Nothing here throws when GA is blocked: dataLayer is a plain array, so a
 * push with no consumer is harmless.
 */

const GA_ID = 'G-CKNF5FXSW6';

declare global {
  interface Window { dataLayer: unknown[] }
}

/** gtag pushes its own `arguments` object — a rest array is not equivalent. */
export function gtag(..._args: unknown[]): void {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export function initAnalytics(): void {
  window.dataLayer = window.dataLayer || [];
  gtag('js', new Date());
  gtag('config', GA_ID);
}

/** Record an interaction. Params show up as event parameters in GA4. */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  try {
    gtag('event', name, params);
  } catch {
    /* analytics must never break the page */
  }
}
