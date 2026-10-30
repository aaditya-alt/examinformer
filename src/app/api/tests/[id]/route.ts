import { NextResponse } from 'next/server';
import { getTestById } from '@/lib/testService';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const test = getTestById(id);

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: test });
}
