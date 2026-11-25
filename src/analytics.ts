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

/**
 * Record an interaction.
 *
 * Event NAMES are reportable in GA4 with no setup — they show up under
 * Engagement → Events straight away. Event PARAMETERS are collected but stay
 * invisible until someone registers them as custom dimensions in the property,
 * which no amount of client code can do.
 *
 * So anything with few possible values (which player, which language) is baked
 * into the name and needs no dashboard work. Parameters are still sent for the
 * open-ended detail — chiefly item_name, whose values come from the sheet and
 * so cannot go in the name: GA4 caps a property at 500 distinct event names.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  try {
    gtag('event', name, params);
  } catch {
    /* analytics must never break the page */
  }
}
