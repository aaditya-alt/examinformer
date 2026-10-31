import { supabase, isSupabaseConfigured } from './supabase';
import bundledTests from '@/data/mock-tests-bundle.json';
import {
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  generateChapterTest,
  generateSectionalTest,
  generateSmartFullMock
} from './questionBank';

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
}

// Built-in verified tests
export const INITIAL_TESTS: CBTTest[] = [
  // 1. SSC CGL Tier 2
  {
    id: 'ssc-cgl-tier2-mock-1',
    title: 'SSC CGL 2024/2026 Tier-2 Official Paper-1 (Math, Reasoning, English & GA)',
    examCode: 'ssc-cgl-tier2',
    examFamily: 'ssc',
    type: 'full_mock',
    durationMinutes: 135,
    totalMarks: 390,
    totalQuestions: 130,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 60,
    difficulty: 'Tier-2 Merit (+3.0 / -1.0)',
    isPublished: true,
    sections: [
      {
        id: 'sec-tier2-module1',
        name: 'Section 1: Mathematical Abilities & Reasoning (60 Qs)',
        questions: (bundledTests as any)[0]?.sections[2]?.questions?.slice(0, 30)?.map((q: any, i: number) => ({
          ...q,
          qno: i + 1,
          marks: 3,
          negativeMarks: 1,
          sectionName: 'Section 1: Mathematical Abilities & Reasoning'
        })) || []
      },
      {
        id: 'sec-tier2-module2',
        name: 'Section 2: English Language & General Awareness (70 Qs)',
        questions: (bundledTests as any)[0]?.sections[3]?.questions?.slice(0, 35)?.map((q: any, i: number) => ({
          ...q,
          qno: i + 31,
          marks: 3,
          negativeMarks: 1,
          sectionName: 'Section 2: English Language & General Awareness'
        })) || []
      }
    ]
  },

  // 2. SSC CHSL Tier 1
  {
    id: 'ssc-chsl-tier1-shift1',
    title: 'SSC CHSL 10+2 Tier-1 Official Previous Year Paper (Shift 1)',
    examCode: 'ssc-chsl-tier1',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 60,
    totalMarks: 200,
    totalQuestions: 100,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 15,
    difficulty: 'Tier-1 CBT (+2.0 / -0.50)',
    isPublished: true,
    sections: (bundledTests as any)[1]?.sections || []
  },

  // 3. SSC CHSL Tier 2
  {
    id: 'ssc-chsl-tier2-mock-1',
    title: 'SSC CHSL Tier-2 All-India Mock Paper (Math, Reasoning, English & Computer)',
    examCode: 'ssc-chsl-tier2',
    examFamily: 'ssc',
    type: 'full_mock',
    durationMinutes: 135,
    totalMarks: 360,
    totalQuestions: 120,
    difficulty: 'Tier-2 Pattern (+3.0 / -1.0)',
    isPublished: true,
    sections: (bundledTests as any)[0]?.sections || []
  },

  // 4. SSC CPO Tier 1
  {
    id: 'ssc-cpo-tier1-mock-1',
    title: 'SSC CPO Sub-Inspector in Delhi Police & CAPFs Tier-1 Official Mock',
    examCode: 'ssc-cpo-tier1',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 120,
    totalMarks: 200,
    totalQuestions: 100,
    difficulty: 'SI in CAPFs (+1.0 / -0.25)',
    isPublished: true,
    sections: (bundledTests as any)[2]?.sections || []
  },

  // 5. SSC CPO Tier 2
  {
    id: 'ssc-cpo-tier2-english',
    title: 'SSC CPO Tier-2 English Language & Comprehension Master Paper',
    examCode: 'ssc-cpo-tier2',
    examFamily: 'ssc',
    type: 'sectional',
    durationMinutes: 120,
    totalMarks: 200,
    totalQuestions: 84,
    difficulty: 'Paper-2 English (+1.0 / -0.25)',
    isPublished: true,
    sections: [
      {
        id: 'cpo-eng-sec',
        name: 'English Language and Comprehension',
        questions: (bundledTests as any)[5]?.sections[0]?.questions || []
      }
    ]
  },

  // 6. SSC MTS & Havaldar
  {
    id: 'ssc-mts-2024-full-mock',
    title: 'SSC MTS & Havaldar Official Previous Year Paper (Session 1 & 2)',
    examCode: 'ssc-mts',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 90,
    totalMarks: 270,
    totalQuestions: 90,
    difficulty: 'Session 1 (Qualifying) & Session 2 (Merit)',
    isPublished: true,
    sections: [
      {
        id: 'mts-sess1',
        name: 'Session 1: Numerical & Mathematical Ability (No Negative)',
        questions: (bundledTests as any)[0]?.sections[2]?.questions?.slice(0, 20)?.map((q: any) => ({ ...q, marks: 3, negativeMarks: 0 })) || []
      },
      {
        id: 'mts-sess2',
        name: 'Session 2: General Awareness & English Language (-1.0 Neg)',
        questions: (bundledTests as any)[0]?.sections[1]?.questions?.slice(0, 25)?.map((q: any) => ({ ...q, marks: 3, negativeMarks: 1 })) || []
      }
    ]
  },

  // 7. SSC GD Constable
  {
    id: 'ssc-gd-constable-mock-1',
    title: 'SSC GD Constable in CAPFs & Assam Rifles 80-Question Official Paper',
    examCode: 'ssc-gd',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 60,
    totalMarks: 160,
    totalQuestions: 80,
    difficulty: 'CBT Exam (+2.0 / -0.25)',
    isPublished: true,
    sections: [
      {
        id: 'gd-sec1',
        name: 'Part A: General Intelligence & Reasoning (20 Qs)',
        questions: (bundledTests as any)[0]?.sections[0]?.questions?.slice(0, 20)?.map((q: any) => ({ ...q, marks: 2, negativeMarks: 0.25 })) || []
      },
      {
        id: 'gd-sec2',
        name: 'Part B: General Knowledge & Elementary Mathematics (20 Qs)',
        questions: (bundledTests as any)[0]?.sections[2]?.questions?.slice(0, 20)?.map((q: any) => ({ ...q, marks: 2, negativeMarks: 0.25 })) || []
      }
    ]
  },

  // 8. Delhi Police Constable
  {
    id: 'delhi-police-constable-mock-1',
    title: 'Delhi Police Constable (Executive) Recruitment Official Paper',
    examCode: 'delhi-police',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 100,
    difficulty: 'Delhi Police CBT (+1.0 / -0.25)',
    isPublished: true,
    sections: (bundledTests as any)[0]?.sections || []
  },

  // 9. RRB NTPC Graduate CBT 2
  {
    id: 'rrb-ntpc-grad-cbt2-mock-1',
    title: 'RRB NTPC Graduate (CBT-2) Level 5 & 6 Station Master 120-Q Mock',
    examCode: 'rrb-ntpc-grad-cbt2',
    examFamily: 'rrb',
    type: 'full_mock',
    durationMinutes: 90,
    totalMarks: 120,
    totalQuestions: 107,
    difficulty: 'CBT-2 120 Marks Pattern (+1.0 / -0.33)',
    isPublished: true,
    sections: (bundledTests as any)[4]?.sections || []
  },

  // 10. RRB NTPC UG CBT 1
  {
    id: 'rrb-ntpc-ug-cbt1-mock-1',
    title: 'RRB NTPC Under-Graduate (12th Level CBT-1) Full Length Mock Test',
    examCode: 'rrb-ntpc-ug-cbt1',
    examFamily: 'rrb',
    type: 'full_mock',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 107,
    difficulty: 'CEN Under-Graduate (+1.0 / -0.33)',
    isPublished: true,
    sections: (bundledTests as any)[4]?.sections || []
  },

  // 11. RRB NTPC UG CBT 2
  {
    id: 'rrb-ntpc-ug-cbt2-mock-1',
    title: 'RRB NTPC Under-Graduate (12th Level CBT-2) Level 2 & 3 Merit Paper',
    examCode: 'rrb-ntpc-ug-cbt2',
    examFamily: 'rrb',
    type: 'full_mock',
    durationMinutes: 90,
    totalMarks: 120,
    totalQuestions: 107,
    difficulty: 'Level 2 & 3 Merit (+1.0 / -0.33)',
    isPublished: true,
    sections: (bundledTests as any)[4]?.sections || []
  },

  // 12. RRB Section Controller
  {
    id: 'rrb-section-controller-mock-1',
    title: 'RRB Section Controller & Station Master Operating Cadre CBT Mock',
    examCode: 'rrb-section-controller',
    examFamily: 'rrb',
    type: 'full_mock',
    durationMinutes: 90,
    totalMarks: 120,
    totalQuestions: 107,
    difficulty: 'Operating Cadre (+1.0 / -0.33)',
    isPublished: true,
    sections: (bundledTests as any)[4]?.sections || []
  },

  // 13. RRB Group D
  {
    id: 'rrb-group-d-cbt-mock-1',
    title: 'RRB Group D (Level-1 CEN RRC) All-India CBT Practice Paper',
    examCode: 'rrb-group-d',
    examFamily: 'rrb',
    type: 'full_mock',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 107,
    difficulty: '100 Qs (+1.0 / -0.33)',
    isPublished: true,
    sections: (bundledTests as any)[4]?.sections || []
  },

  // 14. RRB ALP
  {
    id: 'rrb-alp-cbt1-mock-1',
    title: 'RRB Assistant Loco Pilot & Technician (CEN 01/2024) First Stage CBT-1',
    examCode: 'rrb-alp',
    examFamily: 'rrb',
    type: 'full_mock',
    durationMinutes: 60,
    totalMarks: 75,
    totalQuestions: 50,
    difficulty: 'First Stage CBT (+1.0 / -0.33)',
    isPublished: true,
    sections: [
      {
        id: 'alp-math',
        name: 'Mathematics & General Science',
        questions: (bundledTests as any)[3]?.sections[0]?.questions || []
      }
    ]
  }
];

// In-memory tests store
const initialList: CBTTest[] = [
  ...(bundledTests as unknown as CBTTest[]),
  ...INITIAL_TESTS
];

const testsStore = new Map<string, CBTTest>(initialList.map((t) => [t.id, t]));

export function getAvailableTests(filterExam?: string): CBTTest[] {
  const all = Array.from(testsStore.values());
  if (filterExam && filterExam !== 'all') {
    return all.filter((t) => {
      const code = t.examCode.toLowerCase();
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

  // Dynamic Chapter Test
  if (id.startsWith('ch-')) {
    const parts = id.split('-'); // e.g. ch-math-trigonometry-&-heights-distances-20
    const subject = parts[1] as 'math' | 'reasoning' | 'english' | 'ga';
    const count = parseInt(parts[parts.length - 1], 10) || 20;
    const chapterSlug = parts.slice(2, -1).join('-');

    const availableChapters = CHAPTER_TAXONOMY[subject] || [];
    const matchedChapter = availableChapters.find((ch) =>
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

  // Dynamic Full Mock
  if (id.startsWith('smart-mock-')) {
    const examCode = id.replace('smart-mock-', '');
    const test = generateSmartFullMock(examCode);
    testsStore.set(id, test);
    return test;
  }

  return undefined;
}

export function registerNewTest(test: CBTTest): void {
  testsStore.set(test.id, test);
}
