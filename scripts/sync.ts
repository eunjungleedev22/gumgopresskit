#!/usr/bin/env tsx
/**
 * Manual sync script — run with: npm run sync
 * Requires DATABASE_URL and API keys in .env
 */
import 'dotenv/config';
import { fetchAllSources } from '../src/lib/fetchers';
import { deduplicateAndSave, expireOldJobs } from '../src/lib/deduplicator';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('\n[sync] Starting job sync...');
  const startedAt = Date.now();

  const sourceResults = await fetchAllSources();

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const result of sourceResults) {
    if (result.error) {
      console.error(`[sync] ${result.source} FAILED: ${result.error}`);
      continue;
    }

    console.log(`[sync] ${result.source}: fetched ${result.jobs.length} jobs`);

    const log = await prisma.syncLog.create({
      data: { source: result.source, status: 'RUNNING' },
    });

    try {
      const { added, skipped } = await deduplicateAndSave(result.jobs);
      totalAdded += added;
      totalSkipped += skipped;

      await prisma.syncLog.update({
        where: { id: log.id },
        data: { status: 'SUCCESS', jobsAdded: added, jobsSkipped: skipped, finishedAt: new Date() },
      });

      console.log(`[sync] ${result.source}: +${added} added, ${skipped} skipped`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      await prisma.syncLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: msg, finishedAt: new Date() },
      });
      console.error(`[sync] ${result.source} save failed:`, msg);
    }
  }

  const expired = await expireOldJobs();

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n[sync] Done in ${elapsed}s`);
  console.log(`[sync] Total: +${totalAdded} added | ${totalSkipped} skipped | ${expired} expired`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
