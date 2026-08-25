/**
 * Gigs — expected sheet columns:
 *   date        ISO date string, e.g. 2026-06-14
 *   venue       Venue or club name
 *   city        City, Country
 *   ticket_url  Full URL to the ticket page (blank if sold out or TBA)
 *   status      "upcoming" | "sold_out" | "cancelled"  (default "upcoming")
 *
 * Cancelled and past rows are dropped; the rest sort ascending by date.
 * The whole section stays hidden unless at least one gig survives.
 */

import { fetchSheet, type Row } from './sheets';
import { escHtml, hrefAttr } from './safe';

export interface Gig {
  date: Date;
  venue: string;
  city: string;
  ticketUrl: string;
  status: 'upcoming' | 'sold_out' | 'cancelled';
}

function rowToGig(row: Row): Gig | null {
  if (!row['date'] || !row['venue']) return null;
  const d = new Date(row['date']);
  if (isNaN(d.getTime())) return null;

  const status = (row['status'] ?? '').trim().toLowerCase();
  return {
    date: d,
    venue: row['venue'],
    city: row['city'] ?? '',
    ticketUrl: (row['ticket_url'] ?? '').trim(),
    status: status === 'sold_out' || status === 'cancelled' ? status : 'upcoming',
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function gigRow(gig: Gig): string {
  const soldOut = gig.status === 'sold_out';
  const label   = soldOut ? 'Sold Out' : 'Tickets';

  const ticket = gig.ticketUrl && !soldOut
    ? `<a class="gig-ticket" href="${hrefAttr(gig.ticketUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : `<span class="gig-ticket sold-out">${soldOut ? label : 'TBA'}</span>`;

  return `
    <div class="gig-row reveal">
      <span class="gig-date">${escHtml(formatDate(gig.date))}</span>
      <div class="gig-info">
        <p class="gig-venue">${escHtml(gig.venue)}</p>
        ${gig.city ? `<p class="gig-city">${escHtml(gig.city)}</p>` : ''}
      </div>
      ${ticket}
    </div>`;
}

export async function renderGigs(csvUrl: string): Promise<void> {
  const section = document.getElementById('gigs');
  const list    = document.getElementById('gigs-list');
  if (!list) return;

  try {
    const rows = await fetchSheet(csvUrl);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gigs = rows
      .map(rowToGig)
      .filter((g): g is Gig => g !== null && g.status !== 'cancelled' && g.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Nothing upcoming — leave the section hidden rather than showing an empty shell
    if (gigs.length === 0) return;

    list.innerHTML = gigs.map(gigRow).join('');
    section?.classList.remove('hidden');
  } catch (e) {
    // Live dates are supplementary — a fetch failure leaves the section hidden
    // rather than showing visitors a red error banner.
    console.error('[gigs] failed to load:', e);
  }
}
