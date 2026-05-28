import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllSources } from '@/lib/fetchers';
import { deduplicateAndSave, expireOldJobs } from '@/lib/deduplicator';

export const maxDuration = 300; // 5 minute timeout for Vercel Pro

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const syncResults: Array<{
    source: string;
    added: number;
    skipped: number;
    error?: string;
  }> = [];

  const sourceResults = await fetchAllSources();

  for (const result of sourceResults) {
    const log = await prisma.syncLog.create({
      data: { source: result.source, status: 'RUNNING' },
    });

    if (result.error) {
      await prisma.syncLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: result.error, finishedAt: new Date() },
      });
      syncResults.push({ source: result.source, added: 0, skipped: 0, error: result.error });
      continue;
    }

    try {
      const { added, skipped } = await deduplicateAndSave(result.jobs);
      await prisma.syncLog.update({
        where: { id: log.id },
        data: { status: 'SUCCESS', jobsAdded: added, jobsSkipped: skipped, finishedAt: new Date() },
      });
      syncResults.push({ source: result.source, added, skipped });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown';
      await prisma.syncLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', error: errorMsg, finishedAt: new Date() },
      });
      syncResults.push({ source: result.source, added: 0, skipped: 0, error: errorMsg });
    }
  }

  const expired = await expireOldJobs();

  return NextResponse.json({
    success: true,
    results: syncResults,
    expired,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({ logs });
}
