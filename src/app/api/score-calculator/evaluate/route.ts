import { NextResponse } from 'next/server';
import { evaluateAnswerKey } from '@/lib/scoreService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, htmlContent, examFamily, examTitle, category, zone, customRule } = body;

    if (!url && !htmlContent) {
      return NextResponse.json(
        { error: 'Please provide either an Answer Key URL or paste the HTML response sheet.' },
        { status: 400 }
      );
    }

    const result = await evaluateAnswerKey({
      url,
      htmlContent,
      examFamily,
      examTitle,
      category,
      zone,
      customRule
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Evaluation API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to process answer key.' },
      { status: 500 }
    );
  }
}
