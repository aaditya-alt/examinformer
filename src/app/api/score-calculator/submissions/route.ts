import { NextResponse } from 'next/server';
import { getAllSubmissions, getSubmissionById } from '@/lib/scoreService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const submission = getSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: submission });
  }

  const all = getAllSubmissions();
  return NextResponse.json({ success: true, count: all.length, data: all });
}
