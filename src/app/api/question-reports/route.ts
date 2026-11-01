import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORTS_FILE = path.join(process.cwd(), 'src', 'data', 'question-reports.json');

interface QuestionReport {
  id: string;
  testId: string;
  testTitle?: string;
  qno: number;
  questionText?: string;
  issueType: 'wrong_answer' | 'bad_explanation' | 'typing_error' | 'missing_options' | 'other';
  description: string;
  userEmail?: string;
  userId?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
}

function loadReports(): QuestionReport[] {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn('Could not read question-reports.json:', e);
  }
  return [];
}

function saveReports(list: QuestionReport[]) {
  try {
    const dir = path.dirname(REPORTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save to question-reports.json:', e);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const testId = searchParams.get('testId');

    let reports = loadReports();
    if (status && status !== 'all') {
      reports = reports.filter(r => r.status === status);
    }
    if (testId) {
      reports = reports.filter(r => r.testId === testId);
    }

    return NextResponse.json({ success: true, reports });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testId, testTitle, qno, questionText, issueType, description, userEmail, userId } = body;

    if (!testId || !qno || !issueType) {
      return NextResponse.json(
        { success: false, error: 'testId, qno, and issueType are required' },
        { status: 400 }
      );
    }

    const newReport: QuestionReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      testId,
      testTitle: testTitle || 'CBT Mock Test',
      qno: Number(qno),
      questionText: questionText ? String(questionText).substring(0, 300) : '',
      issueType,
      description: description ? String(description).trim() : '',
      userEmail,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save locally
    const reports = loadReports();
    reports.unshift(newReport);
    saveReports(reports);

    // Sync to Supabase if available
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('question_reports').insert({
          id: newReport.id,
          test_id: newReport.testId,
          test_title: newReport.testTitle,
          question_number: newReport.qno,
          question_text: newReport.questionText,
          issue_type: newReport.issueType,
          description: newReport.description,
          user_email: newReport.userEmail,
          user_id: newReport.userId,
          status: 'pending'
        });
      } catch (e: any) {
        console.warn('Supabase question_reports sync notice:', e.message);
      }
    }

    return NextResponse.json({ success: true, report: newReport });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { reportId, status, updatedQuestion } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: 'reportId and status are required' },
        { status: 400 }
      );
    }

    const reports = loadReports();
    const target = reports.find(r => r.id === reportId);
    if (!target) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    target.status = status;
    if (status === 'resolved') {
      target.resolvedAt = new Date().toISOString();
    }
    saveReports(reports);

    // If an update to question text or explanation was provided, save to test file!
    if (updatedQuestion && target.testId) {
      try {
        const testFile = path.join(process.cwd(), 'src', 'data', 'tests', `${target.testId}.json`);
        if (fs.existsSync(testFile)) {
          const testData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
          let changed = false;
          (testData.sections || []).forEach((sec: any) => {
            (sec.questions || []).forEach((q: any) => {
              if (q.qno === target.qno) {
                if (updatedQuestion.questionText) q.questionText = updatedQuestion.questionText;
                if (updatedQuestion.explanation) q.explanation = updatedQuestion.explanation;
                if (updatedQuestion.correctOption) q.correctOption = Number(updatedQuestion.correctOption);
                changed = true;
              }
            });
          });
          if (changed) {
            fs.writeFileSync(testFile, JSON.stringify(testData, null, 2), 'utf-8');
          }
        }
      } catch (e: any) {
        console.warn('Error applying question fix to test file:', e.message);
      }
    }

    return NextResponse.json({ success: true, report: target });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
