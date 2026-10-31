import testsCatalog from '@/data/tests-catalog.json';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  generateChapterTest,
  generateSectionalTest,
  generateSmartFullMock
} from './questionBank';

const fs = typeof window === 'undefined' ? eval("require('fs')") : null;
const path = typeof window === 'undefined' ? eval("require('path')") : null;

export interface CBTQuestion {
  id: string;
  qno: number;
  questionText: string;
  questionTextHi?: string;
  questionImages?: string[];
  options: {
    id: number;
    text: string;
    textHi?: string;
    imageUrl?: string;
  }[];
  correctOption: number;
  explanation?: string;
  explanationHi?: string;
  marks: number;
  negativeMarks: number;
  sectionName: string;
}

export interface CBTSection {
  id: string;
  name: string;
  questions: CBTQuestion[];
}

export interface CBTTest {
  id: string;
  title: string;
  examCode: string;
  examFamily: 'ssc' | 'rrb' | 'other';
  type: 'pyq' | 'full_mock' | 'sectional' | 'live';
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  sections: CBTSection[];
  isPublished: boolean;
  hasSectionalTiming?: boolean;
  sectionalTimingMinutes?: number;
  difficulty?: string;
  positiveMarks?: number;
  negativeMarks?: number;
  isOfficialPYQ?: boolean;
  examYear?: number;
}

// Memory cache for actively loaded tests
const testsStore = new Map<string, CBTTest>();

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

  // Load from disk if available (src/data/tests/<id>.json)
  try {
    const filePath = path.join(process.cwd(), 'src/data/tests', `${id}.json`);
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const test = JSON.parse(fileContent) as CBTTest;
      testsStore.set(id, test);
      return test;
    }
  } catch (err) {
    console.warn(`Could not load test ${id} from disk:`, err);
  }

  // Dynamic Chapter Test
  if (id.startsWith('ch-')) {
    const parts = id.split('-'); // e.g. ch-math-trigonometry-&-heights-distances-20
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
    testsStore.set(id, test);
    return test;
  }

  // Dynamic Sectional Test
  if (id.startsWith('sec-')) {
    const parts = id.split('-'); // e.g. sec-ssc-cgl-tier1-quantitative-aptitude
    const examCode = `${parts[1]}-${parts[2]}-${parts[3] || 'tier1'}`;
    const sectionName = parts.slice(3).join(' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const test = generateSectionalTest(examCode, sectionName || 'Sectional Speed Booster');
    test.id = id;
    testsStore.set(id, test);
    return test;
  }

  // Smart Generated Full Mock
  if (id.startsWith('gen-')) {
    const examCode = id.replace('gen-', '');
    const test = generateSmartFullMock(examCode);
    test.id = id;
    testsStore.set(id, test);
    return test;
  }

  return undefined;
}

export function registerNewTest(newTest: CBTTest): boolean {
  if (!newTest.id || !newTest.title) return false;
  testsStore.set(newTest.id, newTest);
  return true;
}

export function deleteTest(id: string): boolean {
  return testsStore.delete(id);
}
