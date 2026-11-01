import fs from 'fs';
import path from 'path';
import testsCatalog from '@/data/tests-catalog.json';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { CBTTest, CBTSection, CBTQuestion } from './types/cbt';
import {
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  generateChapterTest,
  generateSectionalTest,
  generateSmartFullMock
} from './questionBank';

import { testsStore, registerNewTest, deleteTest } from './testStore';

export * from './types/cbt';
export { testsStore, registerNewTest, deleteTest };

export function getStandardSections(examCode?: string, title?: string): CBTSection[] {
  const code = (examCode || '').toLowerCase();
  const t = (title || '').toLowerCase();
  const isSSC = code.includes('ssc') || t.includes('ssc');
  const isRailway = code.includes('rrb') || t.includes('rrb') || t.includes('railway') || t.includes('alp') || t.includes('group d') || t.includes('ntpc');

  if (isRailway) {
    if (code.includes('alp') || t.includes('alp')) {
      return [
        { id: 'sec_1', name: 'Mathematics', questions: [] },
        { id: 'sec_2', name: 'General Intelligence & Reasoning', questions: [] },
        { id: 'sec_3', name: 'General Science', questions: [] },
        { id: 'sec_4', name: 'General Awareness & Current Affairs', questions: [] }
      ];
    }
    if (code.includes('group-d') || t.includes('group d') || t.includes('level-1')) {
      return [
        { id: 'sec_1', name: 'General Science', questions: [] },
        { id: 'sec_2', name: 'Mathematics', questions: [] },
        { id: 'sec_3', name: 'General Intelligence and Reasoning', questions: [] },
        { id: 'sec_4', name: 'General Awareness and Current Affairs', questions: [] }
      ];
    }
    // NTPC UG & Graduate
    return [
      { id: 'sec_1', name: 'General Awareness', questions: [] },
      { id: 'sec_2', name: 'Mathematics', questions: [] },
      { id: 'sec_3', name: 'General Intelligence and Reasoning', questions: [] }
    ];
  }

  if (isSSC) {
    if (code.includes('mts') || t.includes('mts')) {
      return [
        { id: 'sec_1', name: 'Numerical and Mathematical Ability', questions: [] },
        { id: 'sec_2', name: 'Reasoning Ability and Problem Solving', questions: [] },
        { id: 'sec_3', name: 'General Awareness', questions: [] },
        { id: 'sec_4', name: 'English Language and Comprehension', questions: [] }
      ];
    }
    // CGL, CHSL, etc.
    return [
      { id: 'sec_1', name: 'General Intelligence & Reasoning', questions: [] },
      { id: 'sec_2', name: 'General Awareness', questions: [] },
      { id: 'sec_3', name: 'Quantitative Aptitude', questions: [] },
      { id: 'sec_4', name: 'English Comprehension', questions: [] }
    ];
  }

  return [
    { id: 'sec_1', name: 'General Intelligence & Reasoning', questions: [] },
    { id: 'sec_2', name: 'General Awareness', questions: [] },
    { id: 'sec_3', name: 'Quantitative Aptitude', questions: [] },
    { id: 'sec_4', name: 'English Comprehension', questions: [] }
  ];
}

export async function getAvailableTests(filterExam?: string): Promise<CBTTest[]> {
  // 1. Fetch from Supabase tests table
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        let mapped = data.map((t) => ({
          id: t.id,
          title: t.title,
          examCode: t.exam_code,
          examFamily: t.exam_code?.startsWith('rrb') ? 'rrb' : 'ssc',
          type: t.type || 'pyq',
          durationMinutes: t.duration_minutes || 60,
          totalMarks: t.total_marks || 100,
          totalQuestions: t.total_questions || 100,
          isPublished: t.is_published ?? true,
          sections: getStandardSections(t.exam_code, t.title)
        })) as unknown as CBTTest[];

        if (filterExam && filterExam !== 'all') {
          const filter = filterExam.toLowerCase();
          mapped = mapped.filter((t) => {
            const code = (t.examCode || '').toLowerCase();
            return code.includes(filter) || t.examFamily === filter;
          });
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Failed to query tests from Supabase:', e);
    }
  }

  // Fallback to static catalog
  const all = testsCatalog as unknown as CBTTest[];
  if (filterExam && filterExam !== 'all') {
    return all.filter((t) => {
      const code = (t.examCode || '').toLowerCase();
      const filter = filterExam.toLowerCase();
      return code.includes(filter) || t.examFamily === filter;
    });
  }
  return all;
}

export async function getTestById(id: string): Promise<CBTTest | undefined> {
  const cleanId = decodeURIComponent(id || '').trim();

  // Check runtime memory store
  if (testsStore.has(cleanId)) {
    return testsStore.get(cleanId);
  }

  // 1. Dynamic Sectional Test (e.g. sec-rrb-ntpc-grad-2025-shift-1-sec-0)
  if (cleanId.startsWith('sec-')) {
    const shiftMatch = cleanId.match(/^sec-(.+)-sec-(\d+)$/);
    if (shiftMatch) {
      const parentId = shiftMatch[1];
      const secIdx = parseInt(shiftMatch[2], 10);
      const parent = await getTestById(parentId);
      if (parent && parent.sections && parent.sections[secIdx]) {
        const targetSec = parent.sections[secIdx];
        const isRailway = (parent.examFamily === 'rrb' || (parent.examCode || '').toLowerCase().includes('rrb'));
        const duration = (parent.examCode || '').includes('tier2') ? 30 : 15;
        const questionsList = targetSec.questions || [];
        const count = questionsList.length || 25;
        const marksPerQ = isRailway ? 1 : 2;
        const singleSec: CBTTest = {
          id: cleanId,
          title: `${targetSec.name} — ${parent.title} (Sectional Mock)`,
          examCode: parent.examCode || 'ssc-cgl',
          examFamily: isRailway ? 'rrb' : 'ssc',
          type: 'sectional',
          durationMinutes: duration,
          totalMarks: count * marksPerQ,
          totalQuestions: count,
          positiveMarks: isRailway ? 1 : 2,
          negativeMarks: isRailway ? Number((1 / 3).toFixed(2)) : 0.5,
          isPublished: true,
          hasSectionalTiming: true,
          sectionalTimingMinutes: duration,
          sections: [{
            id: targetSec.id || `sec-${secIdx}`,
            name: targetSec.name,
            questions: questionsList
          }]
        };
        testsStore.set(cleanId, singleSec);
        return singleSec;
      }
    }
  }

  // 2. Fetch full shift from Supabase tests and questions table
  const client = supabaseAdmin || supabase;
  if (client) {
    try {
      // Look up test record by exact id or like id
      let { data: testRow } = await client
        .from('tests')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (!testRow) {
        const { data: rowAlt } = await client
          .from('tests')
          .select('*')
          .ilike('id', cleanId.replace(/_/g, '-'))
          .maybeSingle();
        testRow = rowAlt;
      }

      if (testRow) {
        const { data: qRows, error: qErr } = await client
          .from('questions')
          .select('*')
          .eq('test_id', testRow.id)
          .order('question_number', { ascending: true });

        if (qRows && !qErr && qRows.length > 0) {
          const isSSC = (testRow.exam_code || '').toLowerCase().includes('ssc') ||
                        (testRow.title || '').toLowerCase().includes('ssc');
          const isRailway = (testRow.exam_code || '').toLowerCase().includes('rrb') ||
                            (testRow.title || '').toLowerCase().includes('rrb') ||
                            (testRow.title || '').toLowerCase().includes('railway');

          const getSectionName = (qno: number, totalQ: number, existingSec?: string): string => {
            if (existingSec && existingSec !== 'null' && existingSec !== 'undefined' && existingSec.trim().length > 0) {
              return existingSec;
            }
            if (isSSC) {
              if (totalQ === 100) {
                if (qno <= 25) return 'General Intelligence & Reasoning';
                if (qno <= 50) return 'General Awareness';
                if (qno <= 75) return 'Quantitative Aptitude';
                return 'English Comprehension';
              }
              if (totalQ === 130 || totalQ === 150) {
                if (qno <= 30) return 'Mathematical Abilities';
                if (qno <= 60) return 'Reasoning and General Intelligence';
                if (qno <= 105) return 'English Language and Comprehension';
                if (qno <= 130) return 'General Awareness';
                return 'Computer Knowledge';
              }
            }
            if (isRailway) {
              if (totalQ === 100) {
                if (qno <= 40) return 'General Awareness';
                if (qno <= 70) return 'Mathematics';
                return 'General Intelligence and Reasoning';
              }
              if (totalQ === 75) {
                if (qno <= 20) return 'Mathematics';
                if (qno <= 45) return 'General Intelligence & Reasoning';
                if (qno <= 65) return 'General Science';
                return 'General Awareness & Current Affairs';
              }
            }
            return 'General Section';
          };

          const sectionMap = new Map<string, CBTQuestion[]>();

          qRows.forEach((q) => {
            const secName = getSectionName(q.question_number, qRows.length, q.section_id);
            if (!sectionMap.has(secName)) {
              sectionMap.set(secName, []);
            }

            const rawOptions = Array.isArray(q.options) ? q.options : [];
            const mappedOptions = rawOptions.map((o: any, idx: number) => ({
              id: o.id || idx + 1,
              text: o.text_en || o.text || `Option ${o.id || idx + 1}`,
              textHi: o.text_hi || o.text_en || o.text || `Option ${o.id || idx + 1}`,
              imageUrl: o.imageUrl
            }));

            sectionMap.get(secName)!.push({
              id: q.id,
              qno: q.question_number,
              questionText: q.question_text_en || '',
              questionTextHi: q.question_text_hi || q.question_text_en || '',
              questionImages: q.question_images || [],
              options: mappedOptions,
              correctOption: q.correct_option_index || 1,
              explanation: q.explanation_en || '',
              explanationHi: q.explanation_hi || q.explanation_en || '',
              marks: isSSC ? 2 : 1,
              negativeMarks: isSSC ? 0.5 : Number((1 / 3).toFixed(2)),
              sectionName: secName,
              examOrigin: testRow.title
            });
          });

          const sections: CBTSection[] = Array.from(sectionMap.entries()).map(([name, qs], idx) => ({
            id: `sec_${idx + 1}`,
            name,
            questions: qs
          }));

          const cbtTest: CBTTest = {
            id: testRow.id,
            title: testRow.title,
            examCode: testRow.exam_code,
            examFamily: isRailway ? 'rrb' : 'ssc',
            type: (testRow.type as any) || 'pyq',
            durationMinutes: testRow.duration_minutes || (isRailway ? 90 : 60),
            totalMarks: testRow.total_marks || (qRows.length * (isSSC ? 2 : 1)),
            totalQuestions: testRow.total_questions || qRows.length,
            positiveMarks: isSSC ? 2 : 1,
            negativeMarks: isSSC ? 0.5 : Number((1 / 3).toFixed(2)),
            hasSectionalTiming: isSSC,
            sectionalTimingMinutes: isSSC ? 15 : undefined,
            isPublished: testRow.is_published ?? true,
            sections
          };

          testsStore.set(cleanId, cbtTest);
          testsStore.set(testRow.id, cbtTest);
          return cbtTest;
        }
      }
    } catch (err) {
      console.warn(`Supabase load failed for test ${cleanId}:`, err);
    }
  }

  // 3. Dynamic Chapter or Topic Test (ch-... or topic-...)
  if (cleanId.startsWith('ch-') || cleanId.startsWith('topic-')) {
    const isTopic = cleanId.startsWith('topic-');
    const rawParts = cleanId.replace(/^ch-|^topic-/, '').split('-');
    let duration = 15;
    let count = 20;
    const tokens = [...rawParts];

    if (tokens.length >= 3 && !isNaN(Number(tokens[tokens.length - 1])) && !isNaN(Number(tokens[tokens.length - 2]))) {
      duration = parseInt(tokens.pop()!, 10);
      count = parseInt(tokens.pop()!, 10);
    } else if (tokens.length >= 2 && !isNaN(Number(tokens[tokens.length - 1]))) {
      count = parseInt(tokens.pop()!, 10);
      duration = Math.max(10, count);
    }

    const subjects = ['math', 'reasoning', 'english', 'ga'];
    const subIdx = tokens.findIndex((t) => subjects.includes(t));
    let examFilter: string | undefined = undefined;
    let subject: 'math' | 'reasoning' | 'english' | 'ga' = 'math';
    let topicSlug = '';

    if (subIdx > 0) {
      examFilter = tokens.slice(0, subIdx).join('-');
      subject = tokens[subIdx] as any;
      topicSlug = tokens.slice(subIdx + 1).join('-');
    } else if (subIdx === 0) {
      subject = tokens[0] as any;
      topicSlug = tokens.slice(1).join('-');
    } else {
      topicSlug = tokens.join('-');
    }

    const availableChapters = CHAPTER_TAXONOMY[subject] || [];
    const matchedChapter =
      availableChapters.find(
        (ch) =>
          encodeURIComponent(ch).replace(/%20/g, '-').toLowerCase() === topicSlug ||
          ch.toLowerCase().includes(topicSlug.replace(/-/g, ' ').toLowerCase())
      ) || availableChapters[0] || 'Topic Practice';

    const test = generateChapterTest(subject, matchedChapter, count, duration, examFilter);
    test.id = cleanId;
    test.durationMinutes = duration;
    test.title = `${matchedChapter} — Official PYQ Topic Drill (${test.totalQuestions} Qs • ${duration} Mins)`;
    testsStore.set(cleanId, test);
    return test;
  }

  return undefined;
}
