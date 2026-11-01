import { NextResponse } from 'next/server';
import { pushAnswerKeyToMockTest } from '@/lib/scoreService';

export async function POST(req: Request) {
  try {
    const { submissionId, splitSections, targetExamCode, targetCategory, examYear, customTitle, generateAISolutions } = await req.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required.' },
        { status: 400 }
      );
    }

    const result = await pushAnswerKeyToMockTest(submissionId, Boolean(splitSections), {
      targetExamCode,
      targetCategory,
      examYear: examYear ? Number(examYear) : 2025,
      customTitle,
      generateAISolutions: generateAISolutions !== false
    });
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Admin push-to-test error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to push answer key into test series.' },
      { status: 500 }
    );
  }
}
