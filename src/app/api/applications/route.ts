import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';

function getSession(): string {
  const cookieStore = cookies();
  return cookieStore.get('session_id')?.value ?? crypto.randomUUID();
}

const bodySchema = z.object({ jobId: z.string() });

export async function GET() {
  const sessionId = getSession();
  const applications = await prisma.application.findMany({
    where: { sessionId },
    select: { jobId: true, appliedAt: true },
  });
  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  const sessionId = getSession();
  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const application = await prisma.application.upsert({
    where: { jobId_sessionId: { jobId: parsed.data.jobId, sessionId } },
    create: { jobId: parsed.data.jobId, sessionId },
    update: {},
  });

  const response = NextResponse.json({ application });
  response.cookies.set('session_id', sessionId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: 'lax' });
  return response;
}

export async function DELETE(request: NextRequest) {
  const sessionId = getSession();
  const jobId = request.nextUrl.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 });

  await prisma.application.deleteMany({ where: { jobId, sessionId } });
  return NextResponse.json({ success: true });
}
