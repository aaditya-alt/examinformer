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

export function getAvailableTests(filterExam?: string): CBTTest[] {
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

export function getTestById(id: string): CBTTest | undefined {
  if (testsStore.has(id)) {
    return testsStore.get(id);
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


