/**
 * Refreshes src/writing.json from local body.
 *
 * The build fetches the writer page itself, so the site is current whether or
 * not this is ever run; the snapshot is only what the build falls back to when
 * local body is unreachable or has been rebuilt in a shape this does not know.
 * Run `npm run writing:sync` to update it, and commit the result, so the
 * fallback is never years behind the real page.
 */

import { writeFileSync } from 'node:fs';
import { fetchWriting } from './localbody.mjs';

const data = await fetchWriting();
writeFileSync('src/writing.json', `${JSON.stringify(data, null, 2)}\n`);
console.log(`src/writing.json: ${data.posts.length} posts, newest ${data.posts[0].date} — ${data.posts[0].title}`);
