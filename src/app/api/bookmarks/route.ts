import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';

function getOrCreateSession(): string {
  const cookieStore = cookies();
  let sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) sessionId = crypto.randomUUID();
  return sessionId;
}

const bodySchema = z.object({ jobId: z.string() });

export async function GET(request: NextRequest) {
  const sessionId = getOrCreateSession();
  const bookmarks = await prisma.bookmark.findMany({
    where: { sessionId },
    include: {
      job: {
        select: {
          id: true, title: true, company: true, location: true,
          remoteType: true, tags: true, source: true, postedAt: true,
          url: true, seniority: true, visaSponsorship: true, koreanSpeaking: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ bookmarks, sessionId });
}

export async function POST(request: NextRequest) {
  const sessionId = getOrCreateSession();
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const bookmark = await prisma.bookmark.upsert({
    where: { jobId_sessionId: { jobId: parsed.data.jobId, sessionId } },
    create: { jobId: parsed.data.jobId, sessionId },
    update: {},
  });

  const response = NextResponse.json({ bookmark });
  response.cookies.set('session_id', sessionId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: 'lax' });
  return response;
}

export async function DELETE(request: NextRequest) {
  const sessionId = getOrCreateSession();
  const { searchParams } = request.nextUrl;
  const jobId = searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

  await prisma.bookmark.deleteMany({ where: { jobId, sessionId } });
  return NextResponse.json({ success: true });
}
