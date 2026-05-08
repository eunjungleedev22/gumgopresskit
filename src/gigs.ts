/**
 * Gigs tab — expected sheet columns (row 1 = headers):
 *
 *   date        ISO date string, e.g. 2026-06-14
 *   venue       Venue or club name
 *   city        City, Country
 *   ticket_url  Full URL to ticket page (leave blank if sold out or TBA)
 *   status      "upcoming" | "sold_out" | "cancelled" (default: "upcoming")
 *
 * Rows with status "cancelled" are hidden.
 * Rows are sorted ascending by date.
 */

import { fetchSheet, type Row } from './sheets';

export interface Gig {
  date: Date;
  dateStr: string;
  venue: string;
  city: string;
  ticketUrl: string;
  status: 'upcoming' | 'sold_out' | 'cancelled';
}

function rowToGig(row: Row): Gig | null {
  if (!row['date'] || !row['venue']) return null;
  const d = new Date(row['date']);
  if (isNaN(d.getTime())) return null;

  return {
    date: d,
    dateStr: row['date'],
    venue: row['venue'],
    city: row['city'] ?? '',
    ticketUrl: row['ticket_url'] ?? '',
    status: (row['status'] as Gig['status']) || 'upcoming',
  };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function gigCard(gig: Gig): string {
  const label = gig.status === 'sold_out' ? 'Sold Out' : 'Tickets';
  const ticketHTML = gig.ticketUrl
    ? `<a class="gig-ticket${gig.status === 'sold_out' ? ' sold-out' : ''}" href="${encodeURI(gig.ticketUrl)}" target="_blank" rel="noopener">${label}</a>`
    : gig.status === 'sold_out'
      ? `<span class="gig-ticket sold-out">${label}</span>`
      : `<span class="gig-ticket sold-out">TBA</span>`;

  return `
    <div class="gig-row reveal">
      <span class="gig-date">${formatDate(gig.date)}</span>
      <div class="gig-info">
        <div class="gig-venue">${escHtml(gig.venue)}</div>
        ${gig.city ? `<div class="gig-city">${escHtml(gig.city)}</div>` : ''}
      </div>
      ${ticketHTML}
    </div>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function renderGigs(csvUrl: string): Promise<void> {
  const list = document.getElementById('gigs-list')!;
  const errEl = document.getElementById('gigs-error')!;

  try {
    const rows = await fetchSheet(csvUrl);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const gigs = rows
      .map(rowToGig)
      .filter((g): g is Gig => g !== null && g.status !== 'cancelled' && g.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (gigs.length === 0) {
      list.innerHTML = `<div class="empty-state">No upcoming gigs scheduled. Check back soon.</div>`;
      return;
    }

    list.innerHTML = gigs.map(gigCard).join('');
  } catch (e) {
    list.innerHTML = '';
    errEl.textContent = `Could not load gigs. (${e instanceof Error ? e.message : String(e)})`;
    errEl.classList.remove('hidden');
  }
}
