import fs from 'fs';
import path from 'path';
import testsCatalog from '@/data/tests-catalog.json';
import { supabase, isSupabaseConfigured } from './supabase';
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
          isPublished: t.is_published ?? true
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
  if (testsStore.has(id)) {
    return testsStore.get(id);
  }

  // 1. Fetch from Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: testRow, error: tErr } = await supabase
        .from('tests')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (testRow && !tErr) {
        const { data: qRows, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .eq('test_id', id)
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

          testsStore.set(id, cbtTest);
          return cbtTest;
        }
      }
    } catch (err) {
      console.warn(`Supabase load failed for test ${id}:`, err);
    }
  }

  // 1. Direct path lookup in src/data/tests/<id>.json
  try {
    let filePath = path.join(process.cwd(), 'src/data/tests', `${id}.json`);
    if (!fs.existsSync(filePath)) {
      filePath = path.resolve(__dirname, '../data/tests', `${id}.json`);
    }
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const test = JSON.parse(fileContent) as CBTTest;
      test.sections?.forEach((sec) => {
        sec.questions?.forEach((q) => {
          if (!q.examOrigin) {
            q.examOrigin = test.title;
          }
        });
      });
      testsStore.set(id, test);
      return test;
    }
  } catch (err) {
    console.warn(`Could not load test ${id} from disk:`, err);
  }

  // 2. Dynamic Chapter Test (ch-math-algebra-20)
  if (id.startsWith('ch-')) {
    const parts = id.split('-');
    const subject = parts[1] as 'math' | 'reasoning' | 'english' | 'ga';
    const count = parseInt(parts[parts.length - 1], 10) || 20;
    const chapterSlug = parts.slice(2, -1).join('-');

    const availableChapters = CHAPTER_TAXONOMY[subject] || [];
    const matchedChapter =
      availableChapters.find(
        (ch) =>
          encodeURIComponent(ch).replace(/%20/g, '-').toLowerCase() === chapterSlug ||
          ch.toLowerCase().includes(chapterSlug.replace(/-/g, ' ').toLowerCase())
      ) || availableChapters[0] || 'Chapter Practice';

    const test = generateChapterTest(subject, matchedChapter, count);
    test.id = id;
    test.sections?.forEach(sec => {
      sec.questions?.forEach(q => {
        if (!q.examOrigin) q.examOrigin = `Official 2025 ${matchedChapter} Shift Question`;
      });
    });
    testsStore.set(id, test);
    return test;
  }

  // 3. Dynamic Topic Test (topic-ssc-cgl-math-trigonometry-20-15 or topic-math-trigonometry-20-15)
  if (id.startsWith('topic-')) {
    const rawParts = id.substring('topic-'.length).split('-');
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
    test.id = id;
    test.durationMinutes = duration;
    test.title = `${matchedChapter} — Official PYQ Topic Drill (${test.totalQuestions} Qs • ${duration} Mins)`;
    test.sections?.forEach(sec => {
      sec.questions?.forEach(q => {
        if (!q.examOrigin) q.examOrigin = `Official 2025 ${matchedChapter} Shift Question`;
      });
    });
    testsStore.set(id, test);
    return test;
  }

  // 4. Dynamic Sectional Test from an Authentic Shift or Registry
  if (id.startsWith('sec-')) {
    const shiftMatch = id.match(/^sec-(.+)-sec-(\d+)$/);
    if (shiftMatch) {
      const parentId = shiftMatch[1];
      const secIdx = parseInt(shiftMatch[2], 10);
      const parent = getTestById(parentId);
      if (parent && parent.sections[secIdx]) {
        const targetSec = parent.sections[secIdx];
        const duration = parent.examCode.includes('tier2') ? 30 : 15;
        const questionsList = targetSec.questions || [];
        const count = questionsList.length || 25;
        const marksPerQ = (parent.examFamily === 'rrb' || parent.examCode.toLowerCase().includes('rrb')) ? 1 : 2;
        const singleSec: CBTTest = {
          id,
          title: `${targetSec.name} — ${parent.title} (Sectional Mock)`,
          examCode: parent.examCode,
          examFamily: parent.examFamily,
          type: 'sectional',
          durationMinutes: duration,
          totalMarks: count * marksPerQ,
          totalQuestions: count,
          isPublished: true,
          hasSectionalTiming: true,
          sectionalTimingMinutes: duration,
          sections: [{
            id: targetSec.id || `sec-${secIdx}`,
            name: targetSec.name,
            questions: questionsList
          }]
        };
        testsStore.set(id, singleSec);
        return singleSec;
      }
    }

    const parts = id.split('-');
    const examCode = `${parts[1]}-${parts[2]}-${parts[3] || 'tier1'}`;
    const sectionName = parts.slice(3).join(' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const test = generateSectionalTest(examCode, sectionName || 'Sectional Speed Booster');
    test.id = id;
    test.sections?.forEach(sec => {
      sec.questions?.forEach(q => {
        if (!q.examOrigin) q.examOrigin = `Official 2025 ${examCode.toUpperCase()} Shift Paper`;
      });
    });
    testsStore.set(id, test);
    return test;
  }

  // 5. Smart Generated Full Mock (gen-ssc-cgl-tier1 or smart-mock-ssc-cgl-tier1)
  if (id.startsWith('gen-') || id.startsWith('smart-mock-')) {
    const examCode = id.replace('gen-', '').replace('smart-mock-', '');
    const test = generateSmartFullMock(examCode);
    test.id = id;
    test.sections?.forEach(sec => {
      sec.questions?.forEach(q => {
        if (!q.examOrigin) q.examOrigin = `Official 2025 Paper: ${examCode.toUpperCase()}`;
      });
    });
    testsStore.set(id, test);
    return test;
  }

  return undefined;
}


