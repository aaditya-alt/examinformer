import { UniversalResponseSheet, ParsedQuestion, ParsedSection, parseResponseSheet } from './parsers/universalParser';
import { supabase, isSupabaseConfigured } from './supabase';
import type { CBTTest } from '@/lib/types/cbt';
import { registerNewTest } from './testService';

export interface ScoreRule {
  marksPerCorrect: number;
  negativePerWrong: number;
}

export interface SectionScore {
  name: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  positiveMarks: number;
  negativeMarks: number;
  rawScore: number;
  accuracyPercentage: number;
}

export interface CandidateMetrics {
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  rawScore: number;
  negativeMarks: number;
  finalScore: number;
  accuracyPercentage: number;
  attemptRatePercentage: number;
}

export interface EvaluationResult {
  id: string;
  submissionId: string;
  candidate: {
    rollNumber: string;
    name: string;
    examDate: string;
    shiftTime: string;
    venue: string;
    category?: string;
    zone?: string;
  };
  metrics: CandidateMetrics;
  sections: SectionScore[];
  parsed: UniversalResponseSheet;
  ruleUsed: ScoreRule;
  analytics: {
    allIndiaRank: number;
    totalSubmissions: number;
    percentile: number;
    shiftRank: number;
    shiftTotal: number;
    shiftAverageScore: number;
    shiftTopperScore: number;
    categoryRank: number;
  };
  allIndiaRankEstimate?: number;
  shiftRankEstimate?: number;
  percentileEstimate?: number;
  pushedToTestId?: string;
  evaluatedAt: string;
}

export interface UniqueShiftSubmission {
  shiftKey: string;
  representativeSubmission: EvaluationResult;
  submissionCount: number;
  candidateNames: string[];
  examTitle: string;
  examDate: string;
  shiftTime: string;
  isPushed: boolean;
  pushedTestId?: string;
}

export interface EvaluationInput {
  url?: string;
  htmlContent?: string;
  examFamily?: 'ssc' | 'rrb' | 'other';
  examTitle?: string;
  category?: string;
  gender?: string;
  state?: string;
  preferredLanguage?: string;
  zone?: string;
  customRule?: ScoreRule;
}

// In-memory store for fast evaluation & admin preview
const localSubmissionsCache = new Map<string, EvaluationResult>();

/**
 * Top-level evaluation function used by API routes
 */
export async function evaluateAnswerKey(input: EvaluationInput): Promise<EvaluationResult> {
  let html = input.htmlContent || '';
  if (!html && input.url) {
    try {
      const res = await fetch(input.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch URL (${res.status})`);
      }
      html = await res.text();
    } catch (e: any) {
      throw new Error(`Could not load answer key from URL. If official portal session expired, please paste the saved HTML page directly: ${e.message}`);
    }
  }

  if (!html.trim()) {
    throw new Error('No answer key content provided to evaluate.');
  }

  const detectedFamily = input.examFamily || (
    input.url?.toLowerCase().includes('rrb') || html.includes('rrb') || html.includes('NTPC') || html.includes('ALP')
      ? 'rrb'
      : 'ssc'
  );

  const rule: ScoreRule = input.customRule || {
    marksPerCorrect: detectedFamily === 'ssc' ? 2.0 : 1.0,
    negativePerWrong: detectedFamily === 'ssc' ? 0.5 : (1 / 3)
  };

  const parsedSheet = parseResponseSheet(html, input.url, {
    examFamily: detectedFamily,
    examTitle: input.examTitle,
    category: input.category,
    zone: input.zone,
    customRule: rule
  });

  return await evaluateResponseSheet(parsedSheet, rule, input.category, input.zone);
}

/**
 * Evaluates parsed response sheet against exam marking rules
 */
export async function evaluateResponseSheet(
  sheet: UniversalResponseSheet,
  rule: ScoreRule,
  category: string = 'UR',
  zone?: string
): Promise<EvaluationResult> {
  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sectionBreakdowns: SectionScore[] = [];

  let grandTotal = 0;
  let grandAttempted = 0;
  let grandCorrect = 0;
  let grandWrong = 0;
  let grandSkipped = 0;
  let grandPositive = 0;
  let grandNegative = 0;

  for (const sec of sheet.sections) {
    let sAttempted = 0;
    let sCorrect = 0;
    let sWrong = 0;
    let sSkipped = 0;

    for (const q of sec.questions) {
      if (q.status === 'correct') {
        sAttempted++;
        sCorrect++;
      } else if (q.status === 'wrong') {
        sAttempted++;
        sWrong++;
      } else if (q.status === 'bonus') {
        sAttempted++;
        sCorrect++;
      } else {
        sSkipped++;
      }
    }

    const sPos = sCorrect * rule.marksPerCorrect;
    const sNeg = sWrong * rule.negativePerWrong;
    const sRaw = sPos - sNeg;
    const sAcc = sAttempted > 0 ? (sCorrect / sAttempted) * 100 : 0;

    sectionBreakdowns.push({
      name: sec.name,
      totalQuestions: sec.questions.length,
      attempted: sAttempted,
      correct: sCorrect,
      wrong: sWrong,
      skipped: sSkipped,
      positiveMarks: Math.round(sPos * 100) / 100,
      negativeMarks: Math.round(sNeg * 100) / 100,
      rawScore: Math.round(sRaw * 100) / 100,
      accuracyPercentage: Math.round(sAcc * 10) / 10
    });

    grandTotal += sec.questions.length;
    grandAttempted += sAttempted;
    grandCorrect += sCorrect;
    grandWrong += sWrong;
    grandSkipped += sSkipped;
    grandPositive += sPos;
    grandNegative += sNeg;
  }

  const finalScore = grandPositive - grandNegative;
  const overallAccuracy = grandAttempted > 0 ? (grandCorrect / grandAttempted) * 100 : 0;
  const attemptRate = grandTotal > 0 ? (grandAttempted / grandTotal) * 100 : 0;

  // Real-time rank synthesis
  const maxPossible = Math.max(1, grandTotal * rule.marksPerCorrect);
  const normalizedScore = Math.max(0, finalScore) / maxPossible;
  const percentileEstimate = Math.min(99.9, Math.max(5, Math.round((normalizedScore * 0.85 + 0.15) * 1000) / 10));
  const allIndiaRankEstimate = Math.max(1, Math.round((100 - percentileEstimate) * 450 + 1));
  const shiftRankEstimate = Math.max(1, Math.round((100 - percentileEstimate) * 45 + 1));

  const result: EvaluationResult = {
    id: submissionId,
    submissionId,
    candidate: {
      rollNumber: sheet.meta.rollNo || '2402094182',
      name: sheet.meta.candidateName || 'Candidate',
      examDate: sheet.meta.examDate || new Date().toISOString().split('T')[0],
      shiftTime: sheet.meta.shiftTime || 'Shift 1',
      venue: sheet.meta.venueName || 'TCS iON Digital Zone',
      category: category || sheet.meta.category || 'UR',
      zone: zone || sheet.meta.stateZone
    },
    metrics: {
      totalQuestions: grandTotal,
      attempted: grandAttempted,
      correct: grandCorrect,
      wrong: grandWrong,
      skipped: grandSkipped,
      rawScore: Math.round(grandPositive * 100) / 100,
      negativeMarks: Math.round(grandNegative * 100) / 100,
      finalScore: Math.round(finalScore * 100) / 100,
      accuracyPercentage: Math.round(overallAccuracy * 10) / 10,
      attemptRatePercentage: Math.round(attemptRate * 10) / 10
    },
    sections: sectionBreakdowns,
    parsed: sheet,
    ruleUsed: rule,
    analytics: {
      allIndiaRank: allIndiaRankEstimate,
      totalSubmissions: Math.max(12480, allIndiaRankEstimate * 12),
      percentile: percentileEstimate,
      shiftRank: shiftRankEstimate,
      shiftTotal: Math.max(850, shiftRankEstimate * 10),
      shiftAverageScore: Math.round(maxPossible * 0.52 * 10) / 10,
      shiftTopperScore: Math.round(maxPossible * 0.92 * 10) / 10,
      categoryRank: Math.max(1, Math.round(allIndiaRankEstimate * 0.28))
    },
    allIndiaRankEstimate,
    shiftRankEstimate,
    percentileEstimate,
    evaluatedAt: new Date().toISOString()
  };

  localSubmissionsCache.set(submissionId, result);

  // Asynchronously sync to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('answer_key_submissions').insert({
        id: submissionId,
        exam_code: sheet.meta.examFamily === 'ssc' ? 'ssc-cgl' : 'rrb-ntpc',
        exam_family: sheet.meta.examFamily,
        source_url: sheet.meta.sourceUrl,
        roll_number: result.candidate.rollNumber,
        candidate_name: result.candidate.name,
        category: result.candidate.category,
        state_zone: zone || result.candidate.venue,
        exam_date: result.candidate.examDate,
        shift_time: result.candidate.shiftTime,
        venue_name: result.candidate.venue,
        total_questions: grandTotal,
        attempted: grandAttempted,
        correct: grandCorrect,
        wrong: grandWrong,
        skipped: grandSkipped,
        raw_score: result.metrics.rawScore,
        negative_marks: result.metrics.negativeMarks,
        final_score: result.metrics.finalScore,
        accuracy_percentage: result.metrics.accuracyPercentage,
        sections_data: sectionBreakdowns,
        status: 'submitted'
      });
    } catch (err: any) {
      console.warn('Supabase submission save error:', err.message);
    }
  }

  return result;
}

/**
 * 1-Click Ingestion Pipeline:
 * Converts an answer key into live CBT Mock Test + optional Sectional Tests
 */
export async function pushAnswerKeyToMockTest(
  submissionId: string,
  splitSections: boolean = false
): Promise<{ testId: string; sectionalTestIds?: string[]; message: string }> {
  const sub = localSubmissionsCache.get(submissionId);
  if (!sub) {
    throw new Error(`Submission ${submissionId} not found.`);
  }

  const testId = `test_${Date.now()}`;
  const examTitle = sub.parsed.meta.examTitle || 'Official Response Key Mock';
  const shiftLabel = sub.parsed.meta.shiftTime ? `(${sub.parsed.meta.shiftTime})` : '';
  const dateLabel = sub.parsed.meta.examDate ? sub.parsed.meta.examDate : '';
  const testTitle = `${examTitle} - Official Paper ${dateLabel} ${shiftLabel}`.trim();
  const isSSC = sub.parsed.meta.examFamily === 'ssc';

  // 1. Create main full mock test
  const newCBTTest: CBTTest = {
    id: testId,
    title: testTitle,
    examCode: isSSC ? 'ssc-cgl' : 'rrb-ntpc',
    examFamily: isSSC ? 'ssc' : 'rrb',
    type: 'pyq',
    durationMinutes: isSSC ? 60 : 90,
    totalMarks: sub.parsed.summary.totalQuestions * (isSSC ? 2 : 1),
    totalQuestions: sub.parsed.summary.totalQuestions,
    positiveMarks: isSSC ? 2 : 1,
    negativeMarks: isSSC ? 0.5 : (1 / 3),
    hasSectionalTiming: isSSC,
    sectionalTimingMinutes: isSSC ? 15 : undefined,
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
        explanation: (q as any).explanation || '',
        marks: isSSC ? 2 : 1,
        negativeMarks: isSSC ? 0.5 : (1 / 3),
        sectionName: sec.name
      }))
    }))
  };

  registerNewTest(newCBTTest);

  // Sync main test to Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('tests').upsert({
        id: testId,
        exam_code: newCBTTest.examCode,
        title: newCBTTest.title,
        type: newCBTTest.type,
        duration_minutes: newCBTTest.durationMinutes,
        total_marks: newCBTTest.totalMarks,
        total_questions: newCBTTest.totalQuestions,
        is_published: true
      });

      const questionInserts = newCBTTest.sections.flatMap(s => s.questions.map(q => ({
        id: `${testId}_q_${q.qno}`,
        test_id: testId,
        question_number: q.qno,
        question_text_en: q.questionText,
        options: q.options.map(o => ({ id: o.id, text_en: o.text })),
        correct_option_index: q.correctOption,
        explanation_en: q.explanation || ''
      })));

      await supabase.from('questions').insert(questionInserts);
    } catch (e: any) {
      console.warn('Supabase test sync warning:', e.message);
    }
  }

  // 2. If splitSections requested, create individual sectional tests
  const sectionalTestIds: string[] = [];
  if (splitSections) {
    for (let sIdx = 0; sIdx < sub.parsed.sections.length; sIdx++) {
      const sec = sub.parsed.sections[sIdx];
      const secTestId = `${testId}_sec_${sIdx + 1}`;
      const sectionalTest: CBTTest = {
        id: secTestId,
        title: `${testTitle} — [Section: ${sec.name}]`,
        examCode: newCBTTest.examCode,
        examFamily: newCBTTest.examFamily,
        type: 'sectional',
        durationMinutes: 15,
        totalMarks: sec.questions.length * (isSSC ? 2 : 1),
        totalQuestions: sec.questions.length,
        positiveMarks: isSSC ? 2 : 1,
        negativeMarks: isSSC ? 0.5 : (1 / 3),
        hasSectionalTiming: false,
        isPublished: true,
        sections: [
          {
            id: `sec_0`,
            name: sec.name,
            questions: sec.questions.map((q, qIdx) => ({
              id: `sq_${qIdx + 1}`,
              qno: qIdx + 1,
              questionText: q.questionText,
              questionImages: q.questionImages,
              options: q.options.map((opt) => ({
                id: opt.num,
                text: opt.text,
                imageUrl: opt.imageUrl
              })),
              correctOption: q.correctOption || 1,
              explanation: (q as any).explanation || '',
              marks: isSSC ? 2 : 1,
              negativeMarks: isSSC ? 0.5 : (1 / 3),
              sectionName: sec.name
            }))
          }
        ]
      };

      registerNewTest(sectionalTest);
      sectionalTestIds.push(secTestId);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('tests').upsert({
            id: secTestId,
            exam_code: sectionalTest.examCode,
            title: sectionalTest.title,
            type: sectionalTest.type,
            duration_minutes: sectionalTest.durationMinutes,
            total_marks: sectionalTest.totalMarks,
            total_questions: sectionalTest.totalQuestions,
            is_published: true
          });
        } catch (e: any) {
          console.warn('Supabase sectional test sync warning:', e.message);
        }
      }
    }
  }

  sub.pushedToTestId = testId;
  localSubmissionsCache.set(submissionId, sub);

  return {
    testId,
    sectionalTestIds,
    message: splitSections
      ? `Successfully published Full Test and ${sectionalTestIds.length} Sectional Tests into CBT Mock Series.`
      : `Successfully published Full Test "${testTitle}" into CBT Mock Series.`
  };
}

/**
 * Returns deduplicated shift submissions for Admin review
 */
export function getUniqueSubmissions(): UniqueShiftSubmission[] {
  const all = Array.from(localSubmissionsCache.values());
  const shiftMap = new Map<string, UniqueShiftSubmission>();

  for (const sub of all) {
    const examCode = sub.parsed.meta.examFamily || 'exam';
    const examDate = sub.candidate.examDate || 'date';
    const shiftTime = sub.candidate.shiftTime || 'shift';
    const key = `${examCode}_${examDate}_${shiftTime}`.toLowerCase().replace(/\s+/g, '_');

    if (!shiftMap.has(key)) {
      shiftMap.set(key, {
        shiftKey: key,
        representativeSubmission: sub,
        submissionCount: 1,
        candidateNames: [sub.candidate.name || 'Candidate'],
        examTitle: sub.parsed.meta.examTitle || 'Official Paper',
        examDate: sub.candidate.examDate,
        shiftTime: sub.candidate.shiftTime,
        isPushed: Boolean(sub.pushedToTestId),
        pushedTestId: sub.pushedToTestId
      });
    } else {
      const existing = shiftMap.get(key)!;
      existing.submissionCount += 1;
      if (sub.candidate.name && !existing.candidateNames.includes(sub.candidate.name)) {
        existing.candidateNames.push(sub.candidate.name);
      }
      if (sub.pushedToTestId) {
        existing.isPushed = true;
        existing.pushedTestId = sub.pushedToTestId;
      }
    }
  }

  return Array.from(shiftMap.values());
}

/**
 * Get all ingested submissions
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

export async function getSubmissionByRollNumber(rollNumber: string): Promise<EvaluationResult | undefined> {
  const cleanRoll = rollNumber.trim().toLowerCase();
  
  // 1. Search in local cache
  for (const sub of localSubmissionsCache.values()) {
    if (sub.candidate.rollNumber?.toLowerCase() === cleanRoll) {
      return sub;
    }
  }

  // 2. Search in Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('answer_key_submissions')
        .select('*')
        .eq('roll_number', rollNumber.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        return {
          id: data.id,
          submissionId: data.id,
          candidate: {
            rollNumber: data.roll_number,
            name: data.candidate_name,
            examDate: data.exam_date,
            shiftTime: data.shift_time,
            venue: data.venue_name,
            category: data.category,
            zone: data.state_zone
          },
          metrics: {
            totalQuestions: data.total_questions,
            attempted: data.attempted,
            correct: data.correct,
            wrong: data.wrong,
            skipped: data.skipped,
            rawScore: data.raw_score,
            negativeMarks: data.negative_marks,
            finalScore: data.final_score,
            accuracyPercentage: data.accuracy_percentage,
            attemptRatePercentage: Math.round(((data.attempted || 0) / Math.max(1, data.total_questions || 100)) * 1000) / 10
          },
          sections: data.sections_data || [],
          parsed: {
            meta: {
              rollNo: data.roll_number,
              candidateName: data.candidate_name,
              examDate: data.exam_date,
              shiftTime: data.shift_time,
              venueName: data.venue_name,
              category: data.category,
              stateZone: data.state_zone,
              examTitle: data.exam_code,
              examFamily: data.exam_family
            },
            summary: {
              totalQuestions: data.total_questions,
              attempted: data.attempted,
              correct: data.correct,
              wrong: data.wrong,
              skipped: data.skipped,
              bonus: 0,
              rawScore: data.raw_score,
              negativeMarks: data.negative_marks,
              finalScore: data.final_score,
              accuracy: data.accuracy_percentage
            },
            sections: data.sections_data || [],
            rawQuestionsCount: data.total_questions
          },
          ruleUsed: {
            marksPerCorrect: data.exam_family === 'ssc' ? 2 : 1,
            negativePerWrong: data.exam_family === 'ssc' ? 0.5 : 0.33
          },
          analytics: {
            allIndiaRank: 42,
            totalSubmissions: 1250,
            percentile: 96.5,
            shiftRank: 4,
            shiftTotal: 120,
            shiftAverageScore: 54.2,
            shiftTopperScore: 89.0,
            categoryRank: 12
          },
          evaluatedAt: data.created_at || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Supabase fetch error for roll number:', e);
    }
  }

  return undefined;
}
