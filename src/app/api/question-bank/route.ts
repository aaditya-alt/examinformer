import { NextResponse } from 'next/server';
import {
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  filterQuestionBank,
  generateChapterTest,
  generateSectionalTest,
  generateSmartFullMock
} from '@/lib/questionBank';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Return full taxonomy of exams and chapters
  if (action === 'taxonomy') {
    return NextResponse.json({
      success: true,
      exams: EXAM_REGISTRY,
      chapters: CHAPTER_TAXONOMY
    });
  }

  // Generate dynamic test
  if (action === 'generate') {
    const type = searchParams.get('type'); // 'chapter' | 'sectional' | 'full'

    if (type === 'chapter') {
      const subject = (searchParams.get('subject') || 'math') as any;
      const chapter = searchParams.get('chapter') || CHAPTER_TAXONOMY.math[0];
      const count = parseInt(searchParams.get('count') || '20', 10);
      const test = generateChapterTest(subject, chapter, count);
      return NextResponse.json({ success: true, data: test });
    }

    if (type === 'sectional') {
      const examCode = searchParams.get('examCode') || 'ssc-cgl-tier1';
      const sectionName = searchParams.get('sectionName') || 'Quantitative Aptitude';
      const test = generateSectionalTest(examCode, sectionName);
      return NextResponse.json({ success: true, data: test });
    }

    if (type === 'full') {
      const examCode = searchParams.get('examCode') || 'ssc-cgl-tier1';
      const test = generateSmartFullMock(examCode);
      return NextResponse.json({ success: true, data: test });
    }
  }

  // Filter questions
  const examCode = searchParams.get('examCode') || undefined;
  const subject = (searchParams.get('subject') as any) || undefined;
  const chapter = searchParams.get('chapter') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const questions = filterQuestionBank({ examCode, subject, chapter, limit });
  return NextResponse.json({
    success: true,
    total: questions.length,
    data: questions
  });
}
