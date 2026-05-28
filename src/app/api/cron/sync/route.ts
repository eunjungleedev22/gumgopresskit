import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron - calls the sync endpoint with proper auth
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.VERCEL_URL}`;

  const response = await fetch(`${baseUrl}/api/sync`, {
    method: 'POST',
    headers: {
      'x-cron-secret': process.env.CRON_SECRET ?? '',
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return NextResponse.json(data);
}
