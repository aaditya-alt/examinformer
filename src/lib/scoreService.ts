import { supabase, isSupabaseConfigured } from './supabase';
import { UniversalAnswerKeyParser, ParsedAnswerKey, ExamRule } from './parsers/universalParser';
import { registerNewTest, CBTTest } from './testService';

export interface EvaluationInput {
  url?: string;
  htmlContent?: string;
  examFamily?: 'ssc' | 'rrb' | 'other';
  examTitle?: string;
  category?: string;
  zone?: string;
  customRule?: ExamRule;
}

export interface RankAnalytics {
  allIndiaRank: number;
  totalSubmissions: number;
  shiftRank: number;
  shiftTotal: number;
  categoryRank: number;
  categoryTotal: number;
  percentile: number;
  shiftAverageScore: number;
  shiftTopperScore: number;
}

export interface EvaluationResult {
  id: string;
  parsed: ParsedAnswerKey;
  analytics: RankAnalytics;
  pushedToTestId?: string;
}

// In-memory cache when running without Supabase or for testing
const localSubmissionsCache: Map<string, EvaluationResult> = new Map();

/**
 * Fetch HTML from student's DigiALM / SSC URL with bot-resilient headers
 */
export async function fetchAnswerKeyHtml(url: string): Promise<string> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  try {
    const res = await fetch(url, { headers, redirect: 'follow' });
    if (!res.ok) {
      throw new Error(`Failed to load URL (${res.status}): ${res.statusText}`);
    }
    return await res.text();
  } catch (err: any) {
    throw new Error(`Could not fetch answer key from URL. If the official window is closed or IP-protected, please paste the saved HTML page directly. Details: ${err.message}`);
  }
}

/**
 * Calculate dynamic ranks across submissions
 */
function computeRanks(
  allSubmissions: EvaluationResult[],
  currentScore: number,
  category?: string,
  shift?: string
): RankAnalytics {
  const totalSubmissions = allSubmissions.length;
  let allIndiaRank = 1;
  let shiftRank = 1;
  let shiftTotal = 0;
  let categoryRank = 1;
  let categoryTotal = 0;
  let shiftScores: number[] = [];

  for (const sub of allSubmissions) {
    const s = sub.parsed.summary.finalScore;

    // All India
    if (s > currentScore) allIndiaRank++;

    // Shift
    if (shift && sub.parsed.meta.shiftTime === shift) {
      shiftTotal++;
      shiftScores.push(s);
      if (s > currentScore) shiftRank++;
    }

    // Category
    if (category && sub.parsed.meta.category === category) {
      categoryTotal++;
      if (s > currentScore) categoryRank++;
    }
  }

  // If this is the only entry or default sample
  const benchmarkTotal = Math.max(totalSubmissions, 1);
  const percentile = parseFloat((((benchmarkTotal - allIndiaRank + 1) / benchmarkTotal) * 100).toFixed(1));
  const shiftAverageScore = shiftScores.length > 0
    ? parseFloat((shiftScores.reduce((a, b) => a + b, 0) / shiftScores.length).toFixed(1))
    : currentScore;
  const shiftTopperScore = shiftScores.length > 0 ? Math.max(...shiftScores, currentScore) : currentScore;

  return {
    allIndiaRank,
    totalSubmissions: benchmarkTotal,
    shiftRank: shiftTotal > 0 ? shiftRank : 1,
    shiftTotal: Math.max(shiftTotal, 1),
    categoryRank: categoryTotal > 0 ? categoryRank : 1,
    categoryTotal: Math.max(categoryTotal, 1),
    percentile,
    shiftAverageScore,
    shiftTopperScore
  };
}

/**
 * Main evaluation pipeline
 */
export async function evaluateAnswerKey(input: EvaluationInput): Promise<EvaluationResult> {
  let html = input.htmlContent || '';

  if (!html && input.url) {
    html = await fetchAnswerKeyHtml(input.url);
  }

  if (!html) {
    throw new Error('Either an Answer Key URL or HTML content must be provided.');
  }

  const parsed = UniversalAnswerKeyParser.parse(html, {
    examFamily: input.examFamily,
    examTitle: input.examTitle,
    category: input.category,
    zone: input.zone,
    customRule: input.customRule,
    sourceUrl: input.url
  });

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('answer_key_submissions').insert({
        id: submissionId,
        exam_code: parsed.meta.examFamily === 'ssc' ? 'ssc-cgl' : 'rrb-ntpc',
        exam_family: parsed.meta.examFamily,
        source_url: input.url || null,
        roll_number: parsed.meta.rollNo,
        candidate_name: parsed.meta.candidateName,
        registration_number: parsed.meta.registrationNo,
        category: parsed.meta.category || 'UR',
        state_zone: parsed.meta.stateZone,
        exam_date: parsed.meta.examDate,
        shift_time: parsed.meta.shiftTime,
        venue_name: parsed.meta.venueName,
        total_questions: parsed.summary.totalQuestions,
        attempted: parsed.summary.attempted,
        correct: parsed.summary.correct,
        wrong: parsed.summary.wrong,
        skipped: parsed.summary.skipped,
        bonus: parsed.summary.bonus,
        raw_score: parsed.summary.rawScore,
        negative_marks: parsed.summary.negativeMarks,
        final_score: parsed.summary.finalScore,
        accuracy_percentage: parsed.summary.accuracy,
        sections_data: parsed.sections,
        status: 'submitted'
      });
    } catch (err) {
      console.warn('Supabase insert warning:', err);
    }
  }

  // Calculate Ranks
  const allSubmissions = Array.from(localSubmissionsCache.values());
  const analytics = computeRanks(
    allSubmissions,
    parsed.summary.finalScore,
    parsed.meta.category,
    parsed.meta.shiftTime
  );

  const result: EvaluationResult = {
    id: submissionId,
    parsed,
    analytics
  };

  localSubmissionsCache.set(submissionId, result);
  return result;
}

/**
 * Admin Pipeline: Push an Ingested Answer Key directly into Mock Tests!
 */
export async function pushAnswerKeyToMockTest(submissionId: string): Promise<{ testId: string; message: string }> {
  const sub = localSubmissionsCache.get(submissionId);
  if (!sub) {
    throw new Error(`Submission ${submissionId} not found.`);
  }

  const testId = `test_${Date.now()}`;
  const examTitle = sub.parsed.meta.examTitle || 'Official Response Key Mock';
  const shiftLabel = sub.parsed.meta.shiftTime ? `(${sub.parsed.meta.shiftTime})` : '';
  const dateLabel = sub.parsed.meta.examDate ? sub.parsed.meta.examDate : '';
  const testTitle = `${examTitle} - Official Paper ${dateLabel} ${shiftLabel}`.trim();

  // If Supabase is configured, create records in tests, test_sections, questions
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: testRecord, error: testErr } = await supabase.from('tests').insert({
        id: testId,
        exam_code: sub.parsed.meta.examFamily === 'ssc' ? 'ssc-cgl' : 'rrb-ntpc',
        title: testTitle,
        type: 'pyq',
        duration_minutes: sub.parsed.meta.examFamily === 'ssc' ? 60 : 90,
        total_marks: sub.parsed.summary.totalQuestions * (sub.parsed.meta.examFamily === 'ssc' ? 2 : 1),
        total_questions: sub.parsed.summary.totalQuestions,
        source_answer_key_id: submissionId,
        is_published: true
      }).select().single();

      if (testErr) throw testErr;

      // Create sections & questions
      for (let sIdx = 0; sIdx < sub.parsed.sections.length; sIdx++) {
        const sec = sub.parsed.sections[sIdx];
        const { data: secRecord } = await supabase.from('test_sections').insert({
          test_id: testId,
          name: sec.name,
          order_index: sIdx,
          marks_per_question: sub.parsed.meta.examFamily === 'ssc' ? 2 : 1,
          negative_marks: sub.parsed.meta.examFamily === 'ssc' ? 0.5 : 0.33
        }).select().single();

        const secId = secRecord?.id || `sec_${sIdx}`;

        const questionInserts = sec.questions.map(q => ({
          test_id: testId,
          section_id: secId,
          question_number: q.qno,
          question_id_str: q.questionId,
          question_text_en: q.questionText,
          question_images: q.questionImages,
          options: q.options.map(opt => ({
            num: opt.num,
            text: opt.text,
            imageUrl: opt.imageUrl,
            isCorrect: opt.isCorrect
          })),
          correct_option_index: q.correctOption,
          is_bonus: q.status === 'bonus'
        }));

        await supabase.from('questions').insert(questionInserts);
      }

      // Update submission status
      await supabase.from('answer_key_submissions').update({
        status: 'pushed_to_test',
        pushed_test_id: testId
      }).eq('id', submissionId);
    } catch (err: any) {
      console.warn('Supabase test publishing warning:', err.message);
    }
  }

  sub.pushedToTestId = testId;
  localSubmissionsCache.set(submissionId, sub);

  // Register in live test repository so students can immediately practice it!
  const newCBTTest: CBTTest = {
    id: testId,
    title: testTitle,
    examCode: sub.parsed.meta.examFamily === 'ssc' ? 'ssc-cgl' : 'rrb-ntpc',
    examFamily: sub.parsed.meta.examFamily,
    type: 'pyq',
    durationMinutes: sub.parsed.meta.examFamily === 'ssc' ? 60 : 90,
    totalMarks: sub.parsed.summary.totalQuestions * (sub.parsed.meta.examFamily === 'ssc' ? 2 : 1),
    totalQuestions: sub.parsed.summary.totalQuestions,
    isPublished: true,
    sections: sub.parsed.sections.map((sec, sIdx) => ({
      id: `sec_${sIdx}`,
      name: sec.name,
      questions: sec.questions.map((q) => ({
        id: `q_${q.qno}`,
        qno: q.qno,
        questionText: q.questionText,
        questionImages: q.questionImages,
        options: q.options.map((opt) => ({
          id: opt.num,
          text: opt.text,
          imageUrl: opt.imageUrl
        })),
        correctOption: q.correctOption || 1,
        marks: sub.parsed.meta.examFamily === 'ssc' ? 2 : 1,
        negativeMarks: sub.parsed.meta.examFamily === 'ssc' ? 0.5 : 0.33,
        sectionName: sec.name
      }))
    }))
  };

  registerNewTest(newCBTTest);

  return {
    testId,
    message: `Successfully converted answer key into official CBT Mock Test: "${testTitle}"`
  };
}

/**
 * Get all ingested submissions for Admin panel
 */
export function getAllSubmissions(): EvaluationResult[] {
  return Array.from(localSubmissionsCache.values());
}

/**
 * Get single submission
 */
export function getSubmissionById(id: string): EvaluationResult | undefined {
  return localSubmissionsCache.get(id);
}
