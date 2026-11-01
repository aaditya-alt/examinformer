import { NextResponse } from 'next/server';
import { getTestById } from '@/lib/testService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const excludeStr = url.searchParams.get('excludeIds') || '';
  const excludeIds = excludeStr ? excludeStr.split(',').filter(Boolean) : [];
  const test = await getTestById(id, excludeIds);

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: test });
}
