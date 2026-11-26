/**
 * Refreshes src/writing.json from local body.
 *
 * This is the only thing on the project that asks local body for anything.
 * The build reads the file and never goes to the network, so how often that
 * site is touched is a schedule — once an hour, from .github/workflows/
 * writing.yml — and not a consequence of how often someone pushes.
 *
 * It writes only when something actually changed, so an hour in which she
 * published nothing leaves the file alone, the workflow finds nothing to
 * commit, and nothing is deployed. `updated` is therefore the date her
 * writing last changed, not the date this last ran.
 *
 * Exit codes: 0 wrote, 0 unchanged (printed either way), non-zero on failure,
 * which fails the scheduled run loudly rather than leaving it to rot.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fetchWriting } from './localbody.mjs';

const FILE = 'src/writing.json';

/** Everything but the timestamp, so a re-run is not a change. */
const body = (d) => JSON.stringify({ source: d.source, bio: d.bio, posts: d.posts });

const fresh = await fetchWriting();

let current = null;
try {
  current = JSON.parse(readFileSync(FILE, 'utf8'));
} catch {
  // No snapshot yet, or an unreadable one: write a good one over it.
}

if (current && body(current) === body(fresh)) {
  console.log(`${FILE}: unchanged (${fresh.posts.length} posts, newest ${fresh.posts[0].date})`);
} else {
  const out = { source: fresh.source, updated: fresh.fetched, bio: fresh.bio, posts: fresh.posts };
  writeFileSync(FILE, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`${FILE}: updated — ${fresh.posts.length} posts, newest ${fresh.posts[0].date} · ${fresh.posts[0].title}`);
}
