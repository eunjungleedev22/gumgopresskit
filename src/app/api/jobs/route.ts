import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

const querySchema = z.object({
  search: z.string().optional(),
  remoteOnly: z.coerce.boolean().optional(),
  region: z.enum(['europe', 'apac', 'global']).optional(),
  koreanSpeaking: z.coerce.boolean().optional(),
  visaSponsorship: z.coerce.boolean().optional(),
  tags: z.string().optional(),
  seniority: z.string().optional(),
  industry: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

const EUROPE_KEYWORDS = ['europe', 'eu', 'uk', 'germany', 'france', 'netherlands', 'spain', 'sweden', 'berlin', 'amsterdam', 'london'];
const APAC_KEYWORDS = ['apac', 'asia', 'korea', 'japan', 'singapore', 'australia', 'sydney', 'tokyo', 'seoul'];

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    search,
    remoteOnly,
    region,
    koreanSpeaking,
    visaSponsorship,
    tags,
    seniority,
    industry,
    source,
    page,
    pageSize,
  } = parsed.data;

  const where: Prisma.JobWhereInput = {
    AND: [
      // Active jobs only
      { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },

      // Full-text search
      search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},

      remoteOnly ? { remoteType: 'REMOTE' } : {},
      koreanSpeaking ? { koreanSpeaking: true } : {},
      visaSponsorship ? { visaSponsorship: true } : {},

      // Region filter via location field
      region === 'europe'
        ? { OR: EUROPE_KEYWORDS.map((kw) => ({ location: { contains: kw, mode: 'insensitive' as const } })) }
        : region === 'apac'
        ? { OR: APAC_KEYWORDS.map((kw) => ({ location: { contains: kw, mode: 'insensitive' as const } })) }
        : {},

      tags ? { tags: { hasSome: tags.split(',') } } : {},

      seniority
        ? { seniority: { in: seniority.split(',') as any } }
        : {},

      industry
        ? { industry: { in: industry.split(',') as any } }
        : {},

      source
        ? { source: { in: source.split(',') as any } }
        : {},
    ],
  };

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: { postedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        externalId: true,
        title: true,
        company: true,
        location: true,
        remoteType: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        url: true,
        tags: true,
        seniority: true,
        visaSponsorship: true,
        koreanSpeaking: true,
        industry: true,
        source: true,
        postedAt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    jobs,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  });
}
