import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORTS_FILE = path.join(process.cwd(), 'src', 'storage', 'question-reports.json');

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

function loadReportsFromFile(): QuestionReport[] {
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

function saveReportsToFile(list: QuestionReport[]) {
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

    const client = supabaseAdmin || supabase;
    const reportsMap = new Map<string, QuestionReport>();

    // 1. Fetch from Supabase question_reports table
    if (client) {
      try {
        let query = client.from('question_reports').select('*').order('created_at', { ascending: false });
        if (status && status !== 'all') query = query.eq('status', status);
        if (testId) query = query.eq('test_id', testId);

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          data.forEach(r => {
            reportsMap.set(r.id, {
              id: r.id,
              testId: r.test_id,
              testTitle: r.test_title || 'CBT Mock Test',
              qno: Number(r.question_number) || 1,
              questionText: r.question_text || '',
              issueType: r.issue_type || 'wrong_answer',
              description: r.description || '',
              userEmail: r.user_email,
              userId: r.user_id,
              status: r.status || 'pending',
              createdAt: r.created_at || new Date().toISOString(),
              resolvedAt: r.resolved_at
            });
          });
        }
      } catch (e) {
        console.warn('Supabase question_reports query notice:', e);
      }
    }

    // 2. Fetch and merge from local file
    const fileReports = loadReportsFromFile();
    fileReports.forEach(r => {
      if (!reportsMap.has(r.id)) {
        if ((!status || status === 'all' || r.status === status) && (!testId || r.testId === testId)) {
          reportsMap.set(r.id, r);
        }
      }
    });

    const reports = Array.from(reportsMap.values());
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReport: QuestionReport = {
      id: reportId,
      testId,
      testTitle: testTitle || 'CBT Mock Test',
      qno: Number(qno),
      questionText: questionText ? String(questionText).substring(0, 400) : '',
      issueType,
      description: description ? String(description).trim() : '',
      userEmail,
      userId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 1. Save to Supabase question_reports
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client.from('question_reports').insert({
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
        console.warn('Supabase question_reports sync note:', e.message);
      }
    }

    // 2. Save locally for bulletproof persistence
    const reports = loadReportsFromFile();
    reports.unshift(newReport);
    saveReportsToFile(reports);

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

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;

    // 1. Update in Supabase
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client
          .from('question_reports')
          .update({
            status,
            resolved_at: resolvedAt
          })
          .eq('id', reportId);
      } catch (e: any) {
        console.warn('Supabase question report update note:', e.message);
      }
    }

    // 2. Update locally
    const reports = loadReportsFromFile();
    const target = reports.find(r => r.id === reportId);
    if (target) {
      target.status = status;
      if (status === 'resolved') {
        target.resolvedAt = resolvedAt || new Date().toISOString();
      }
      saveReportsToFile(reports);
    }

    // 3. If an update to question text or explanation was provided, save to test file!
    const activeTestId = target?.testId;
    const activeQno = target?.qno;

    if (updatedQuestion && activeTestId && activeQno) {
      try {
        const testFile = path.join(process.cwd(), 'src', 'data', 'tests', `${activeTestId}.json`);
        if (fs.existsSync(testFile)) {
          const testData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
          let changed = false;
          (testData.sections || []).forEach((sec: any) => {
            (sec.questions || []).forEach((q: any) => {
              if (q.qno === activeQno) {
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

    return NextResponse.json({ success: true, report: target || { id: reportId, status } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
