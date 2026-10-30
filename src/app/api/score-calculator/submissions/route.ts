import { NextResponse } from 'next/server';
import { getAllSubmissions, getUniqueSubmissions, getSubmissionById, getSubmissionByRollNumber } from '@/lib/scoreService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const rollNumber = searchParams.get('rollNumber');
  const uniqueOnly = searchParams.get('unique') === 'true';

  if (id) {
    const submission = getSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: submission });
  }

  if (rollNumber) {
    const submission = await getSubmissionByRollNumber(rollNumber);
    if (!submission) {
      return NextResponse.json({ error: `No evaluated scorecard found for Roll Number: ${rollNumber}` }, { status: 404 });
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
