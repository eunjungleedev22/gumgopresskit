import { prisma } from './prisma';
import type { NormalizedJob } from '@/types/job';

export async function deduplicateAndSave(
  jobs: NormalizedJob[]
): Promise<{ added: number; skipped: number }> {
  let added = 0;
  let skipped = 0;

  const existingUrls = new Set(
    (await prisma.job.findMany({ select: { url: true } })).map((j) => j.url)
  );

  const seen = new Set<string>();
  const toInsert: NormalizedJob[] = [];

  for (const job of jobs) {
    const key = job.url.trim().toLowerCase();
    if (existingUrls.has(key) || seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    toInsert.push(job);
  }

  if (toInsert.length > 0) {
    await prisma.job.createMany({
      data: toInsert.map((job) => ({
        ...job,
        url: job.url.trim().toLowerCase(),
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      })),
      skipDuplicates: true,
    });
    added = toInsert.length;
  }

  return { added, skipped };
}

export async function expireOldJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const result = await prisma.job.updateMany({
    where: {
      postedAt: { lt: cutoff },
      expiresAt: null,
    },
    data: { expiresAt: new Date() },
  });
  return result.count;
}
