import { NextResponse } from 'next/server';
import { getAvailableTests } from '@/lib/testService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exam = searchParams.get('exam') || 'all';

  const tests = await getAvailableTests(exam);
  return NextResponse.json({ success: true, count: tests.length, data: tests });
}
