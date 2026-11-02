import { CBTSection } from './types/cbt';

export interface ExamBlueprintSection {
  id: string;
  name: string;
  questionCount: number;
  durationMinutes: number;
  positiveMarks: number;
  negativeMarks: number;
  isQualifying?: boolean;
}

export interface ExamBlueprintCombined {
  id: string;
  name: string;
  sectionIds: string[];
  questionCount: number;
  durationMinutes: number;
  totalMarks: number;
  positiveMarks: number;
  negativeMarks: number;
  isQualifying?: boolean;
}

export interface ExamBlueprint {
  examCode: string;
  name: string;
  family: 'ssc' | 'rrb' | 'other';
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  hasSectionalTiming: boolean;
  defaultSectionMinutes?: number;
  sections: ExamBlueprintSection[];
  combinedSections?: ExamBlueprintCombined[];
}

export const OFFICIAL_EXAM_BLUEPRINTS: Record<string, ExamBlueprint> = {
  // ── RRB NTPC Under Graduate (UG) ──
  'rrb-ntpc-ug': {
    examCode: 'rrb-ntpc-ug',
    name: 'RRB NTPC Under Graduate (UG)',
    family: 'rrb',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 100,
    hasSectionalTiming: false, // Free navigation across sections
    sections: [
      { id: 'sec_1', name: 'General Awareness', questionCount: 40, durationMinutes: 35, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_2', name: 'Mathematics', questionCount: 30, durationMinutes: 30, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_3', name: 'General Intelligence and Reasoning', questionCount: 30, durationMinutes: 30, positiveMarks: 1, negativeMarks: 0.33 }
    ]
  },

  // ── RRB NTPC Graduate ──
  'rrb-ntpc-grad': {
    examCode: 'rrb-ntpc-grad',
    name: 'RRB NTPC Graduate',
    family: 'rrb',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 100,
    hasSectionalTiming: false, // Mixed format CBT
    sections: [
      { id: 'sec_1', name: 'General Section (100 Questions Mixed)', questionCount: 100, durationMinutes: 90, positiveMarks: 1, negativeMarks: 0.33 }
    ]
  },

  // ── RRB Section Controller ──
  'rrb-section-controller': {
    examCode: 'rrb-section-controller',
    name: 'RRB Section Controller',
    family: 'rrb',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 100,
    hasSectionalTiming: false,
    sections: [
      { id: 'sec_1', name: 'General Intelligence & Reasoning', questionCount: 30, durationMinutes: 25, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_2', name: 'General Awareness', questionCount: 30, durationMinutes: 25, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_3', name: 'Quantitative Aptitude & Mathematics', questionCount: 30, durationMinutes: 25, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_4', name: 'General Science & Technical Ability', questionCount: 10, durationMinutes: 15, positiveMarks: 1, negativeMarks: 0.33 }
    ]
  },

  // ── RRB ALP (Assistant Loco Pilot) ──
  'rrb-alp': {
    examCode: 'rrb-alp',
    name: 'RRB ALP (Assistant Loco Pilot)',
    family: 'rrb',
    durationMinutes: 60,
    totalMarks: 75,
    totalQuestions: 75,
    hasSectionalTiming: false,
    sections: [
      { id: 'sec_1', name: 'Mathematics', questionCount: 20, durationMinutes: 15, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_2', name: 'General Intelligence & Reasoning', questionCount: 25, durationMinutes: 20, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_3', name: 'General Science', questionCount: 20, durationMinutes: 15, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_4', name: 'General Awareness & Current Affairs', questionCount: 10, durationMinutes: 10, positiveMarks: 1, negativeMarks: 0.33 }
    ]
  },

  // ── RRB Group D (RRC Level-1) ──
  'rrb-group-d': {
    examCode: 'rrb-group-d',
    name: 'RRB Group D (RRC Level-1)',
    family: 'rrb',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 100,
    hasSectionalTiming: false,
    sections: [
      { id: 'sec_1', name: 'General Science', questionCount: 25, durationMinutes: 20, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_2', name: 'Mathematics', questionCount: 25, durationMinutes: 25, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_3', name: 'General Intelligence and Reasoning', questionCount: 30, durationMinutes: 25, positiveMarks: 1, negativeMarks: 0.33 },
      { id: 'sec_4', name: 'General Awareness and Current Affairs', questionCount: 20, durationMinutes: 20, positiveMarks: 1, negativeMarks: 0.33 }
    ]
  },

  // ── SSC CGL Tier-1 ──
  'ssc-cgl': {
    examCode: 'ssc-cgl',
    name: 'SSC CGL Tier-1',
    family: 'ssc',
    durationMinutes: 60,
    totalMarks: 200,
    totalQuestions: 100,
    hasSectionalTiming: true,
    defaultSectionMinutes: 15,
    sections: [
      { id: 'sec_1', name: 'General Intelligence & Reasoning', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 },
      { id: 'sec_2', name: 'General Awareness', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 },
      { id: 'sec_3', name: 'Quantitative Aptitude', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 },
      { id: 'sec_4', name: 'English Comprehension', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 }
    ]
  },

  // ── SSC CGL Tier-2 ──
  'ssc-cgl-tier2': {
    examCode: 'ssc-cgl-tier2',
    name: 'SSC CGL Tier-2 (Mains)',
    family: 'ssc',
    durationMinutes: 135,
    totalMarks: 390, // Computer module is qualifying
    totalQuestions: 150,
    hasSectionalTiming: true,
    sections: [
      { id: 'sec_1', name: 'Mathematical Abilities', questionCount: 30, durationMinutes: 30, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_2', name: 'Reasoning and General Intelligence', questionCount: 30, durationMinutes: 30, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_3', name: 'English Language and Comprehension', questionCount: 45, durationMinutes: 40, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_4', name: 'General Awareness', questionCount: 25, durationMinutes: 20, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_5', name: 'Computer Knowledge', questionCount: 20, durationMinutes: 15, positiveMarks: 3, negativeMarks: 1, isQualifying: true }
    ],
    combinedSections: [
      {
        id: 'combined-1',
        name: 'Section I: Mathematical Abilities & Reasoning',
        sectionIds: ['sec_1', 'sec_2'],
        questionCount: 60,
        durationMinutes: 60,
        totalMarks: 180,
        positiveMarks: 3,
        negativeMarks: 1
      },
      {
        id: 'combined-2',
        name: 'Section II: English Language & General Awareness',
        sectionIds: ['sec_3', 'sec_4'],
        questionCount: 70,
        durationMinutes: 60,
        totalMarks: 210,
        positiveMarks: 3,
        negativeMarks: 1
      },
      {
        id: 'combined-3',
        name: 'Section III: Computer Knowledge Module (Qualifying)',
        sectionIds: ['sec_5'],
        questionCount: 20,
        durationMinutes: 15,
        totalMarks: 60,
        positiveMarks: 3,
        negativeMarks: 1,
        isQualifying: true
      }
    ]
  },

  // ── SSC CHSL Tier-1 ──
  'ssc-chsl': {
    examCode: 'ssc-chsl',
    name: 'SSC CHSL Tier-1',
    family: 'ssc',
    durationMinutes: 60,
    totalMarks: 200,
    totalQuestions: 100,
    hasSectionalTiming: true,
    defaultSectionMinutes: 15,
    sections: [
      { id: 'sec_1', name: 'General Intelligence & Reasoning', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 },
      { id: 'sec_2', name: 'General Awareness', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 },
      { id: 'sec_3', name: 'Quantitative Aptitude', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 },
      { id: 'sec_4', name: 'English Comprehension', questionCount: 25, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.5 }
    ]
  },

  // ── SSC CHSL Tier-2 ──
  'ssc-chsl-tier2': {
    examCode: 'ssc-chsl-tier2',
    name: 'SSC CHSL Tier-2 (Mains)',
    family: 'ssc',
    durationMinutes: 135,
    totalMarks: 360, // Computer module is qualifying
    totalQuestions: 135,
    hasSectionalTiming: true,
    sections: [
      { id: 'sec_1', name: 'Mathematical Abilities', questionCount: 30, durationMinutes: 30, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_2', name: 'Reasoning and General Intelligence', questionCount: 30, durationMinutes: 30, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_3', name: 'English Language and Comprehension', questionCount: 40, durationMinutes: 40, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_4', name: 'General Awareness', questionCount: 20, durationMinutes: 20, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_5', name: 'Computer Knowledge', questionCount: 15, durationMinutes: 15, positiveMarks: 3, negativeMarks: 1, isQualifying: true }
    ],
    combinedSections: [
      {
        id: 'combined-1',
        name: 'Section I: Mathematical Abilities & Reasoning',
        sectionIds: ['sec_1', 'sec_2'],
        questionCount: 60,
        durationMinutes: 60,
        totalMarks: 180,
        positiveMarks: 3,
        negativeMarks: 1
      },
      {
        id: 'combined-2',
        name: 'Section II: English Language & General Awareness',
        sectionIds: ['sec_3', 'sec_4'],
        questionCount: 60,
        durationMinutes: 60,
        totalMarks: 180,
        positiveMarks: 3,
        negativeMarks: 1
      },
      {
        id: 'combined-3',
        name: 'Section III: Computer Knowledge Module (Qualifying)',
        sectionIds: ['sec_5'],
        questionCount: 15,
        durationMinutes: 15,
        totalMarks: 45,
        positiveMarks: 3,
        negativeMarks: 1,
        isQualifying: true
      }
    ]
  },

  // ── SSC MTS & Havaldar ──
  'ssc-mts': {
    examCode: 'ssc-mts',
    name: 'SSC MTS & Havaldar',
    family: 'ssc',
    durationMinutes: 90,
    totalMarks: 150, // Merit score solely on Session II
    totalQuestions: 90,
    hasSectionalTiming: true,
    sections: [
      { id: 'sec_1', name: 'Numerical and Mathematical Ability', questionCount: 20, durationMinutes: 22, positiveMarks: 3, negativeMarks: 0, isQualifying: true },
      { id: 'sec_2', name: 'Reasoning Ability and Problem Solving', questionCount: 20, durationMinutes: 23, positiveMarks: 3, negativeMarks: 0, isQualifying: true },
      { id: 'sec_3', name: 'General Awareness', questionCount: 25, durationMinutes: 20, positiveMarks: 3, negativeMarks: 1 },
      { id: 'sec_4', name: 'English Language and Comprehension', questionCount: 25, durationMinutes: 25, positiveMarks: 3, negativeMarks: 1 }
    ],
    combinedSections: [
      {
        id: 'combined-1',
        name: 'Session I: Numerical Ability & Reasoning (Purely Qualifying)',
        sectionIds: ['sec_1', 'sec_2'],
        questionCount: 40,
        durationMinutes: 45,
        totalMarks: 120,
        positiveMarks: 3,
        negativeMarks: 0,
        isQualifying: true
      },
      {
        id: 'combined-2',
        name: 'Session II: General Awareness & English (Merit Total: 150 Marks)',
        sectionIds: ['sec_3', 'sec_4'],
        questionCount: 50,
        durationMinutes: 45,
        totalMarks: 150,
        positiveMarks: 3,
        negativeMarks: 1
      }
    ]
  },

  // ── SSC CPO / Delhi Police SI ──
  'ssc-cpo': {
    examCode: 'ssc-cpo',
    name: 'SSC CPO (Sub-Inspector in Delhi Police & CAPFs)',
    family: 'ssc',
    durationMinutes: 120,
    totalMarks: 200,
    totalQuestions: 200,
    hasSectionalTiming: false,
    sections: [
      { id: 'sec_1', name: 'General Intelligence & Reasoning', questionCount: 50, durationMinutes: 30, positiveMarks: 1, negativeMarks: 0.25 },
      { id: 'sec_2', name: 'General Knowledge & General Awareness', questionCount: 50, durationMinutes: 25, positiveMarks: 1, negativeMarks: 0.25 },
      { id: 'sec_3', name: 'Quantitative Aptitude', questionCount: 50, durationMinutes: 35, positiveMarks: 1, negativeMarks: 0.25 },
      { id: 'sec_4', name: 'English Comprehension', questionCount: 50, durationMinutes: 30, positiveMarks: 1, negativeMarks: 0.25 }
    ]
  },

  // ── Delhi Police Constable ──
  'delhi-police': {
    examCode: 'delhi-police',
    name: 'Delhi Police Executive Constable',
    family: 'ssc',
    durationMinutes: 90,
    totalMarks: 100,
    totalQuestions: 100,
    hasSectionalTiming: false,
    sections: [
      { id: 'sec_1', name: 'General Knowledge / Current Affairs', questionCount: 50, durationMinutes: 40, positiveMarks: 1, negativeMarks: 0.25 },
      { id: 'sec_2', name: 'Reasoning', questionCount: 25, durationMinutes: 25, positiveMarks: 1, negativeMarks: 0.25 },
      { id: 'sec_3', name: 'Numerical Ability', questionCount: 15, durationMinutes: 15, positiveMarks: 1, negativeMarks: 0.25 },
      { id: 'sec_4', name: 'Computer Fundamentals, MS Excel & Word', questionCount: 10, durationMinutes: 10, positiveMarks: 1, negativeMarks: 0.25 }
    ]
  },

  // ── SSC GD Constable ──
  'ssc-gd': {
    examCode: 'ssc-gd',
    name: 'SSC GD Constable',
    family: 'ssc',
    durationMinutes: 60,
    totalMarks: 160,
    totalQuestions: 80,
    hasSectionalTiming: false,
    sections: [
      { id: 'sec_1', name: 'General Intelligence & Reasoning', questionCount: 20, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.25 },
      { id: 'sec_2', name: 'General Knowledge & General Awareness', questionCount: 20, durationMinutes: 12, positiveMarks: 2, negativeMarks: 0.25 },
      { id: 'sec_3', name: 'Elementary Mathematics', questionCount: 20, durationMinutes: 18, positiveMarks: 2, negativeMarks: 0.25 },
      { id: 'sec_4', name: 'English / Hindi', questionCount: 20, durationMinutes: 15, positiveMarks: 2, negativeMarks: 0.25 }
    ]
  }
};

/**
 * Resolves the exact official exam blueprint dynamically from the registry.
 * Decouples code from hardcoded switch/case statements so adding new exams
 * works automatically.
 */
export function getExamBlueprint(examCode?: string, title?: string): ExamBlueprint {
  const code = (examCode || '').toLowerCase().trim();
  const t = (title || '').toLowerCase().trim();

  // 1. Exact or prefix match
  if (OFFICIAL_EXAM_BLUEPRINTS[code]) {
    return OFFICIAL_EXAM_BLUEPRINTS[code];
  }

  // 2. Specific Tier-2 detection
  if (code.includes('cgl') && (code.includes('tier2') || code.includes('tier-2') || t.includes('tier 2') || t.includes('tier-2') || t.includes('tier ii'))) {
    return OFFICIAL_EXAM_BLUEPRINTS['ssc-cgl-tier2'];
  }
  if (code.includes('chsl') && (code.includes('tier2') || code.includes('tier-2') || t.includes('tier 2') || t.includes('tier-2') || t.includes('tier ii'))) {
    return OFFICIAL_EXAM_BLUEPRINTS['ssc-chsl-tier2'];
  }

  // 3. Railway exams
  if (code.includes('section-controller') || t.includes('section controller')) {
    return OFFICIAL_EXAM_BLUEPRINTS['rrb-section-controller'];
  }
  if (code.includes('ntpc-ug') || t.includes('under graduate') || t.includes(' ug') || t.includes('(ug)')) {
    return OFFICIAL_EXAM_BLUEPRINTS['rrb-ntpc-ug'];
  }
  if (code.includes('ntpc-grad') || code === 'rrb-ntpc' || t.includes('graduate')) {
    return OFFICIAL_EXAM_BLUEPRINTS['rrb-ntpc-grad'];
  }
  if (code.includes('alp') || t.includes('alp')) {
    return OFFICIAL_EXAM_BLUEPRINTS['rrb-alp'];
  }
  if (code.includes('group-d') || t.includes('group d') || t.includes('level-1')) {
    return OFFICIAL_EXAM_BLUEPRINTS['rrb-group-d'];
  }

  // 4. SSC exams
  if (code.includes('cpo') || t.includes('cpo') || t.includes('delhi police si')) {
    return OFFICIAL_EXAM_BLUEPRINTS['ssc-cpo'];
  }
  if (code.includes('delhi-police') || t.includes('delhi police')) {
    return OFFICIAL_EXAM_BLUEPRINTS['delhi-police'];
  }
  if (code.includes('gd') || t.includes('gd constable')) {
    return OFFICIAL_EXAM_BLUEPRINTS['ssc-gd'];
  }
  if (code.includes('mts') || t.includes('mts')) {
    return OFFICIAL_EXAM_BLUEPRINTS['ssc-mts'];
  }
  if (code.includes('chsl') || t.includes('chsl')) {
    return OFFICIAL_EXAM_BLUEPRINTS['ssc-chsl'];
  }
  if (code.includes('cgl') || t.includes('cgl')) {
    return OFFICIAL_EXAM_BLUEPRINTS['ssc-cgl'];
  }

  // 5. Default fallback to SSC Tier-1 standard
  return OFFICIAL_EXAM_BLUEPRINTS['ssc-cgl'];
}

/**
 * Returns dynamic CBTSection objects for any exam
 */
export function getDynamicStandardSections(examCode?: string, title?: string): CBTSection[] {
  const bp = getExamBlueprint(examCode, title);
  return bp.sections.map((sec) => ({
    id: sec.id,
    name: sec.name,
    questions: []
  }));
}
