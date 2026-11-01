import { NextResponse } from 'next/server';
import { computeShiftDifficultyAnalytics, ShiftDifficultyAnalytic } from '@/lib/scoreService';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BENCHMARKS_FILE = path.join(process.cwd(), 'src', 'data', 'shift-benchmarks.json');

export async function GET() {
  try {
    const analytics = computeShiftDifficultyAnalytics();
    return NextResponse.json({
      success: true,
      data: analytics,
      totalShifts: analytics.length,
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    const analytics = computeShiftDifficultyAnalytics();

    if (action === 'save_benchmarks' || action === 'publish') {
      fs.writeFileSync(BENCHMARKS_FILE, JSON.stringify(analytics, null, 2), 'utf-8');
      return NextResponse.json({
        success: true,
        message: `Successfully computed and published normalization benchmarks for ${analytics.length} official shifts!`,
        count: analytics.length
      });
    }

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
