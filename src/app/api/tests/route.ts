import { NextResponse } from 'next/server';
import { getAvailableTests } from '@/lib/testService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exam = searchParams.get('exam') || 'all';

  const tests = getAvailableTests(exam);
  return NextResponse.json({ success: true, count: tests.length, data: tests });
}
