import { NextResponse } from 'next/server';
import { getAllSubmissions, getUniqueSubmissions, getSubmissionById } from '@/lib/scoreService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const uniqueOnly = searchParams.get('unique') === 'true';

  if (id) {
    const submission = getSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: submission });
  }

  if (uniqueOnly) {
    const unique = getUniqueSubmissions();
    return NextResponse.json({ success: true, count: unique.length, data: unique });
  }

  const all = getAllSubmissions();
  return NextResponse.json({ success: true, count: all.length, data: all });
}
