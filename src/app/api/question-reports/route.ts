import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin, supabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORTS_FILE = path.join(process.cwd(), 'src', 'storage', 'question-reports.json');
const SEL_POST_FILE = path.join(process.cwd(), 'src', 'data', 'ssc_selection_post_all_shifts.json');

export interface QuestionDetails {
  questionTextEn?: string;
  questionTextHi?: string;
  options?: Array<{
    id: number | string;
    text_en?: string;
    text_hi?: string;
    text?: string;
    textHi?: string;
    imageUrl?: string;
  }>;
  correctOptionIndex?: number;
  explanationEn?: string;
  explanationHi?: string;
  questionImages?: string[];
}

export interface QuestionReport {
  id: string;
  testId: string;
  testTitle?: string;
  qno: number;
  questionText?: string;
  questionTextHi?: string;
  issueType: 'wrong_answer' | 'bad_explanation' | 'typing_error' | 'missing_options' | 'other';
  description: string;
  userEmail?: string;
  userId?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  questionDetails?: QuestionDetails;
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

// Helper to look up full question from local files or Supabase
async function enrichQuestionData(testId: string, qno: number): Promise<QuestionDetails | null> {
  // 1. Check Selection Post dataset
  try {
    if (fs.existsSync(SEL_POST_FILE)) {
      const selData = JSON.parse(fs.readFileSync(SEL_POST_FILE, 'utf-8'));
      if (selData[testId] && selData[testId].questions && selData[testId].questions[String(qno)]) {
        const q = selData[testId].questions[String(qno)];
        return {
          questionTextEn: q.question_text_en || q.questionText || '',
          questionTextHi: q.question_text_hi || q.questionTextHi || '',
          options: q.options || [],
          correctOptionIndex: q.correct_option_index ?? q.correctOption ?? 0,
          explanationEn: q.explanation_en || q.explanation || '',
          explanationHi: q.explanation_hi || q.explanationHi || '',
          questionImages: q.question_images || q.questionImages || []
        };
      }
    }
  } catch (e) {
    console.warn('Selection post file lookup notice:', e);
  }

  // 2. Check local tests JSON files
  try {
    const localTestFile = path.join(process.cwd(), 'src', 'data', 'tests', `${testId}.json`);
    if (fs.existsSync(localTestFile)) {
      const tData = JSON.parse(fs.readFileSync(localTestFile, 'utf-8'));
      for (const sec of tData.sections || []) {
        for (const q of sec.questions || []) {
          if (q.qno === qno) {
            return {
              questionTextEn: q.questionText || '',
              questionTextHi: q.questionTextHi || '',
              options: q.options || [],
              correctOptionIndex: q.correctOption !== undefined ? q.correctOption - 1 : 0,
              explanationEn: q.explanation || '',
              explanationHi: q.explanationHi || '',
              questionImages: q.questionImages || []
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn('Local test file lookup notice:', e);
  }

  // 3. Check Supabase questions table
  const client = supabaseAdmin || supabase;
  if (client) {
    try {
      const { data, error } = await client
        .from('questions')
        .select('*')
        .eq('test_id', testId)
        .eq('question_number', qno)
        .maybeSingle();

      if (!error && data) {
        return {
          questionTextEn: data.question_text_en || '',
          questionTextHi: data.question_text_hi || '',
          options: Array.isArray(data.options) ? data.options : [],
          correctOptionIndex: data.correct_option_index ?? 0,
          explanationEn: data.explanation_en || '',
          explanationHi: data.explanation_hi || '',
          questionImages: data.question_images || []
        };
      }
    } catch (e) {
      console.warn('Supabase question lookup notice:', e);
    }
  }

  return null;
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

    // Enrich with complete question details (question text EN/HI, options, solution EN/HI)
    await Promise.all(
      reports.map(async (r) => {
        const details = await enrichQuestionData(r.testId, r.qno);
        if (details) {
          r.questionDetails = details;
          if (!r.questionText && details.questionTextEn) {
            r.questionText = details.questionTextEn;
          }
          if (details.questionTextHi) {
            r.questionTextHi = details.questionTextHi;
          }
        }
      })
    );

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
    const { reportId, status, updatedQuestion, testId, qno } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: 'reportId and status are required' },
        { status: 400 }
      );
    }

    const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;

    // 1. Update in Supabase question_reports
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

    // 3. Target test ID and question number
    const activeTestId = testId || target?.testId;
    const activeQno = qno !== undefined ? Number(qno) : target?.qno;

    if (updatedQuestion && activeTestId && activeQno) {
      const qTextEn = updatedQuestion.questionTextEn !== undefined ? updatedQuestion.questionTextEn : updatedQuestion.questionText;
      const qTextHi = updatedQuestion.questionTextHi;
      const explEn = updatedQuestion.explanationEn !== undefined ? updatedQuestion.explanationEn : updatedQuestion.explanation;
      const explHi = updatedQuestion.explanationHi;
      const corrOpt = updatedQuestion.correctOptionIndex !== undefined ? Number(updatedQuestion.correctOptionIndex) : (updatedQuestion.correctOption !== undefined ? Number(updatedQuestion.correctOption) : undefined);
      const qImgs = updatedQuestion.questionImages;
      const opts = updatedQuestion.options;

      // 3A. Update in Supabase questions table
      if (client) {
        try {
          const updatePayload: any = {};
          if (qTextEn !== undefined) updatePayload.question_text_en = qTextEn;
          if (qTextHi !== undefined) updatePayload.question_text_hi = qTextHi;
          if (explEn !== undefined) updatePayload.explanation_en = explEn;
          if (explHi !== undefined) updatePayload.explanation_hi = explHi;
          if (corrOpt !== undefined) updatePayload.correct_option_index = corrOpt;
          if (qImgs !== undefined) updatePayload.question_images = qImgs;
          if (opts !== undefined) updatePayload.options = opts;

          const { error: patchErr } = await client
            .from('questions')
            .update(updatePayload)
            .eq('test_id', activeTestId)
            .eq('question_number', activeQno);

          if (patchErr) {
            console.warn('Supabase question table update error:', patchErr.message);
          }
        } catch (e: any) {
          console.warn('Supabase question table update error:', e.message);
        }
      }

      // 3B. Update locally in Selection Post JSON if applicable
      try {
        if (fs.existsSync(SEL_POST_FILE)) {
          const selData = JSON.parse(fs.readFileSync(SEL_POST_FILE, 'utf-8'));
          if (selData[activeTestId] && selData[activeTestId].questions && selData[activeTestId].questions[String(activeQno)]) {
            const qObj = selData[activeTestId].questions[String(activeQno)];
            if (qTextEn !== undefined) qObj.question_text_en = qTextEn;
            if (qTextHi !== undefined) qObj.question_text_hi = qTextHi;
            if (explEn !== undefined) qObj.explanation_en = explEn;
            if (explHi !== undefined) qObj.explanation_hi = explHi;
            if (corrOpt !== undefined) qObj.correct_option_index = corrOpt;
            if (qImgs !== undefined) qObj.question_images = qImgs;
            if (opts !== undefined) qObj.options = opts;
            fs.writeFileSync(SEL_POST_FILE, JSON.stringify(selData, null, 2), 'utf-8');
          }
        }
      } catch (e: any) {
        console.warn('Error applying question fix to Selection Post file:', e.message);
      }

      // 3C. Update locally in test JSON file if applicable
      try {
        const testFile = path.join(process.cwd(), 'src', 'data', 'tests', `${activeTestId}.json`);
        if (fs.existsSync(testFile)) {
          const testData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
          let changed = false;
          (testData.sections || []).forEach((sec: any) => {
            (sec.questions || []).forEach((q: any) => {
              if (q.qno === activeQno) {
                if (qTextEn !== undefined) q.questionText = qTextEn;
                if (qTextHi !== undefined) q.questionTextHi = qTextHi;
                if (explEn !== undefined) q.explanation = explEn;
                if (explHi !== undefined) q.explanationHi = explHi;
                if (corrOpt !== undefined) q.correctOption = corrOpt;
                if (qImgs !== undefined) q.questionImages = qImgs;
                if (opts !== undefined) q.options = opts;
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
