export interface ExamDefinition {
  id: string;
  name: string;
  shortName: string;
  family: 'ssc' | 'rrb';
  tier: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  marksPerCorrect: number;
  negativePerWrong: number;
  hasSectionalTiming?: boolean;
  sectionalTimingMinutes?: number;
  sections: { name: string; questionCount: number; marks: number }[];
  description: string;
}

export interface MappedQuestion {
  id: string;
  examCode: string;
  examFamily: 'ssc' | 'rrb';
  tier: string;
  year: number;
  shift: string;
  date: string;
  sectionName: string;
  subject: 'math' | 'reasoning' | 'english' | 'ga';
  chapter: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  questionText: string;
  questionTextHi?: string;
  options: { id: number; text: string; textHi?: string }[];
  correctOption: number;
  explanation: string;
  marks: number;
  negativeMarks: number;
}

export const EXAM_REGISTRY: ExamDefinition[] = [
  // ── SSC Exams ──
  {
    id: 'ssc-cgl-tier1',
    name: 'SSC CGL (Tier-1) Combined Graduate Level',
    shortName: 'CGL Tier-1',
    family: 'ssc',
    tier: 'Tier 1',
    totalQuestions: 100,
    durationMinutes: 60,
    totalMarks: 200,
    marksPerCorrect: 2.0,
    negativePerWrong: 0.50,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 15,
    sections: [
      { name: 'General Intelligence and Reasoning', questionCount: 25, marks: 50 },
      { name: 'General Awareness', questionCount: 25, marks: 50 },
      { name: 'Quantitative Aptitude', questionCount: 25, marks: 50 },
      { name: 'English Comprehension', questionCount: 25, marks: 50 },
    ],
    description: 'Tier-1 CBT examination for Inspector, Assistant Section Officer, Auditor, Tax Assistant positions.'
  },
  {
    id: 'ssc-cgl-tier2',
    name: 'SSC CGL (Tier-2) Combined Graduate Level Paper-1',
    shortName: 'CGL Tier-2',
    family: 'ssc',
    tier: 'Tier 2',
    totalQuestions: 130,
    durationMinutes: 135,
    totalMarks: 390,
    marksPerCorrect: 3.0,
    negativePerWrong: 1.0,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 60,
    sections: [
      { name: 'Mathematical Abilities', questionCount: 30, marks: 90 },
      { name: 'Reasoning and General Intelligence', questionCount: 30, marks: 90 },
      { name: 'English Language and Comprehension', questionCount: 45, marks: 135 },
      { name: 'General Awareness', questionCount: 25, marks: 75 },
    ],
    description: 'Tier-2 comprehensive merit CBT with negative marking of 1 mark per incorrect response.'
  },
  {
    id: 'ssc-chsl-tier1',
    name: 'SSC CHSL (Tier-1) Combined Higher Secondary Level (10+2)',
    shortName: 'CHSL Tier-1',
    family: 'ssc',
    tier: 'Tier 1',
    totalQuestions: 100,
    durationMinutes: 60,
    totalMarks: 200,
    marksPerCorrect: 2.0,
    negativePerWrong: 0.50,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 15,
    sections: [
      { name: 'General Intelligence', questionCount: 25, marks: 50 },
      { name: 'General Awareness', questionCount: 25, marks: 50 },
      { name: 'Quantitative Aptitude (Basic Arithmetic)', questionCount: 25, marks: 50 },
      { name: 'English Language (Basic Knowledge)', questionCount: 25, marks: 50 },
    ],
    description: 'CHSL 10+2 examination for LDC, Junior Secretariat Assistant (JSA), Data Entry Operator (DEO).'
  },
  {
    id: 'ssc-chsl-tier2',
    name: 'SSC CHSL (Tier-2) Combined Higher Secondary Level',
    shortName: 'CHSL Tier-2',
    family: 'ssc',
    tier: 'Tier 2',
    totalQuestions: 135,
    durationMinutes: 135,
    totalMarks: 360,
    marksPerCorrect: 3.0,
    negativePerWrong: 1.0,
    sections: [
      { name: 'Math & Reasoning Abilities', questionCount: 60, marks: 180 },
      { name: 'English Language & General Awareness', questionCount: 60, marks: 180 },
      { name: 'Computer Knowledge Module', questionCount: 15, marks: 45 },
    ],
    description: 'CHSL Tier-2 merit-deciding paper with computer knowledge test.'
  },
  {
    id: 'ssc-mts',
    name: 'SSC MTS & Havaldar (Multi-Tasking Staff Non-Technical)',
    shortName: 'SSC MTS',
    family: 'ssc',
    tier: 'Tier 1',
    totalQuestions: 90,
    durationMinutes: 90,
    totalMarks: 150,
    marksPerCorrect: 3.0,
    negativePerWrong: 1.0,
    sections: [
      { name: 'Session 1: Numerical Ability & Reasoning (Qualifying Only, No Negative)', questionCount: 40, marks: 120 },
      { name: 'Session 2: General Awareness & English Language (Merit Determining)', questionCount: 50, marks: 150 },
    ],
    description: 'Official MTS pattern: Final merit is prepared solely on Session 2 performance (150 Marks). Session 1 is qualifying with 0 negative marking.'
  },
  {
    id: 'ssc-gd',
    name: 'SSC GD Constable in CAPFs, SSF, Rifleman in Assam Rifles',
    shortName: 'SSC GD',
    family: 'ssc',
    tier: 'Tier 1',
    totalQuestions: 80,
    durationMinutes: 60,
    totalMarks: 160,
    marksPerCorrect: 2.0,
    negativePerWrong: 0.25,
    sections: [
      { name: 'General Intelligence and Reasoning', questionCount: 20, marks: 40 },
      { name: 'General Knowledge and General Awareness', questionCount: 20, marks: 40 },
      { name: 'Elementary Mathematics', questionCount: 20, marks: 40 },
      { name: 'English / Hindi Language', questionCount: 20, marks: 40 },
    ],
    description: 'Official 80-question GD pattern with authentic 0.25 negative marks per wrong answer.'
  },
  {
    id: 'ssc-cpo-tier1',
    name: 'SSC CPO (Tier-1) Sub-Inspector in Delhi Police & CAPFs',
    shortName: 'CPO Tier-1',
    family: 'ssc',
    tier: 'Tier 1',
    totalQuestions: 100,
    durationMinutes: 120,
    totalMarks: 100,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.25,
    sections: [
      { name: 'General Intelligence and Reasoning', questionCount: 25, marks: 25 },
      { name: 'General Knowledge and General Awareness', questionCount: 25, marks: 25 },
      { name: 'Quantitative Aptitude', questionCount: 25, marks: 25 },
      { name: 'English Comprehension', questionCount: 25, marks: 25 },
    ],
    description: 'Updated official SSC CPO pattern: 100 Questions / 100 Marks with 0.25 negative marking.'
  },
  {
    id: 'ssc-cpo-tier2',
    name: 'SSC CPO (Tier-2) English Language & Comprehension Paper',
    shortName: 'CPO Tier-2',
    family: 'ssc',
    tier: 'Tier 2',
    totalQuestions: 200,
    durationMinutes: 120,
    totalMarks: 200,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.25,
    sections: [
      { name: 'English Language and Comprehension', questionCount: 200, marks: 200 },
    ],
    description: 'Exclusively tests advanced grammar, active/passive voice, narration, vocab, and reading comprehension.'
  },

  // ── RRB / Railway Exams ──
  {
    id: 'rrb-ntpc-ug-cbt1',
    name: 'RRB NTPC Under Graduate (UG) 2025-26 (CBT-1)',
    shortName: 'NTPC UG CBT-1',
    family: 'rrb',
    tier: 'CBT-1',
    totalQuestions: 100,
    durationMinutes: 90,
    totalMarks: 100,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'General Awareness', questionCount: 40, marks: 40 },
      { name: 'Mathematics', questionCount: 30, marks: 30 },
      { name: 'General Intelligence and Reasoning', questionCount: 30, marks: 30 },
    ],
    description: 'Official RRB NTPC Under Graduate (12th Level) CBT-1 examination with strict section-wise structure.'
  },
  {
    id: 'rrb-ntpc-ug-cbt2',
    name: 'RRB NTPC Under Graduate (UG) 2025-26 (CBT-2)',
    shortName: 'NTPC UG CBT-2',
    family: 'rrb',
    tier: 'CBT-2',
    totalQuestions: 120,
    durationMinutes: 90,
    totalMarks: 120,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'General Awareness', questionCount: 50, marks: 50 },
      { name: 'Mathematics', questionCount: 35, marks: 35 },
      { name: 'General Intelligence and Reasoning', questionCount: 35, marks: 35 },
    ],
    description: 'Official RRB NTPC Under Graduate CBT-2 main merit test for Junior Clerk, Accounts Clerk, Trains Clerk.'
  },
  {
    id: 'rrb-ntpc-grad-cbt1',
    name: 'RRB NTPC Graduate 2025-26 (CBT-1)',
    shortName: 'NTPC Grad CBT-1',
    family: 'rrb',
    tier: 'CBT-1',
    totalQuestions: 100,
    durationMinutes: 90,
    totalMarks: 100,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'Test', questionCount: 100, marks: 100 },
    ],
    description: 'Official RRB NTPC Graduate Level CBT-1 paper with authentic mixed question distribution.'
  },
  {
    id: 'rrb-ntpc-grad-cbt2',
    name: 'RRB NTPC Graduate 2025-26 (CBT-2)',
    shortName: 'NTPC Grad CBT-2',
    family: 'rrb',
    tier: 'CBT-2',
    totalQuestions: 120,
    durationMinutes: 90,
    totalMarks: 120,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'Test', questionCount: 120, marks: 120 },
    ],
    description: 'Official RRB NTPC Graduate CBT-2 merit paper for Station Master, Goods Train Manager, Senior Clerk.'
  },
  {
    id: 'rrb-group-d',
    name: 'RRB Group D (RRC CEN 01/2025-26)',
    shortName: 'RRB Group D',
    family: 'rrb',
    tier: 'CBT-1',
    totalQuestions: 100,
    durationMinutes: 90,
    totalMarks: 100,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'General Science', questionCount: 25, marks: 25 },
      { name: 'Mathematics', questionCount: 25, marks: 25 },
      { name: 'General Intelligence and Reasoning', questionCount: 30, marks: 30 },
      { name: 'General Awareness and Current Affairs', questionCount: 20, marks: 20 },
    ],
    description: 'Track Maintainer Grade IV, Helper/Assistant in various railway technical departments.'
  },
  {
    id: 'rrb-section-controller',
    name: 'RRB Section Controller 2025-26',
    shortName: 'Section Controller',
    family: 'rrb',
    tier: 'CBT-1',
    totalQuestions: 100,
    durationMinutes: 90,
    totalMarks: 100,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'General Section', questionCount: 100, marks: 100 },
    ],
    description: 'Specialized railway operating cadre test for Section Controllers and Operations.'
  },
  {
    id: 'rrb-alp-cbt1',
    name: 'RRB ALP 2025-26 (CBT-1)',
    shortName: 'RRB ALP CBT-1',
    family: 'rrb',
    tier: 'CBT-1',
    totalQuestions: 75,
    durationMinutes: 60,
    totalMarks: 75,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'Mathematics', questionCount: 20, marks: 20 },
      { name: 'General Intelligence and Reasoning', questionCount: 25, marks: 25 },
      { name: 'General Science', questionCount: 20, marks: 20 },
      { name: 'General Awareness on Current Affairs', questionCount: 10, marks: 10 },
    ],
    description: 'Assistant Loco Pilot & Technician Grade III first stage computer based test.'
  },
  {
    id: 'rrb-alp-cbt2',
    name: 'RRB ALP 2025-26 (CBT-2)',
    shortName: 'RRB ALP CBT-2',
    family: 'rrb',
    tier: 'CBT-2',
    totalQuestions: 175,
    durationMinutes: 150,
    totalMarks: 175,
    marksPerCorrect: 1.0,
    negativePerWrong: 0.33,
    hasSectionalTiming: false,
    sections: [
      { name: 'Part A: Basic Science & Engineering, Math, Reasoning', questionCount: 100, marks: 100 },
      { name: 'Part B: Relevant Technical Trade', questionCount: 75, marks: 75 },
    ],
    description: 'Assistant Loco Pilot & Technician stage 2 examination for final merit.'
  }
];

export const CHAPTER_TAXONOMY = {
  math: [
    'Trigonometry & Heights-Distances',
    'Algebra & Polynomials',
    'Geometry (Circles & Triangles)',
    'Mensuration 2D & 3D',
    'Number System & Divisibility',
    'Simple & Compound Interest',
    'Profit, Loss & Discount',
    'Time and Work & Pipes-Cisterns',
    'Time, Speed and Distance & Trains',
    'Percentage & Applications',
    'Ratio, Proportion & Partnership',
    'Average, Mixtures & Alligations',
    'Data Interpretation (Charts & Tables)'
  ],
  reasoning: [
    'Series (Number & Alphabet)',
    'Coding-Decoding',
    'Analogy (Word & Number)',
    'Classification & Odd-One-Out',
    'Blood Relations',
    'Direction & Distance Sense',
    'Venn Diagrams & Syllogisms',
    'Order, Ranking & Seating',
    'Non-Verbal & Mirror/Water Images',
    'Dice, Cube & Counting Figures',
    'Statement & Conclusion / Assumptions'
  ],
  english: [
    'Spotting the Error (Grammar)',
    'Sentence Improvement',
    'Fill in the Blanks',
    'Synonyms & Antonyms',
    'Idioms and Phrases',
    'One Word Substitution',
    'Spelling Test / Misspelt Words',
    'Active and Passive Voice',
    'Direct and Indirect Speech',
    'Cloze Test Passages',
    'Reading Comprehension'
  ],
  ga: [
    'Indian Polity & Constitution',
    'Ancient & Medieval Indian History',
    'Modern History & Freedom Struggle',
    'Physical & Indian Geography',
    'Indian Economy & Banking',
    'General Science (Physics & Chemistry)',
    'General Science (Biology & Health)',
    'Static GK (Art, Culture, Dances, Festivals)',
    'Current Affairs, Awards & Sports'
  ]
};

export interface TopicItem {
  id: string;
  name: string;
  subject: 'math' | 'reasoning' | 'english' | 'ga';
  scope: 'all' | 'ssc' | 'rrb';
  questionCountEstimate: number;
  highlight?: string;
}

export const TOPIC_PRACTICE_LIST: TopicItem[] = [
  // ── Quantitative Aptitude ──
  { id: 'trigonometry', name: 'Trigonometry & Heights-Distances', subject: 'math', scope: 'ssc', questionCountEstimate: 340, highlight: 'High Weightage in CGL/CHSL' },
  { id: 'algebra', name: 'Algebra & Polynomials', subject: 'math', scope: 'ssc', questionCountEstimate: 310, highlight: 'SSC Tier 1 & 2 Core' },
  { id: 'geometry', name: 'Geometry (Circles, Chords & Triangles)', subject: 'math', scope: 'ssc', questionCountEstimate: 380, highlight: 'SSC CGL Crucial' },
  { id: 'mensuration', name: 'Mensuration 2D & 3D (Surface & Volume)', subject: 'math', scope: 'all', questionCountEstimate: 420, highlight: 'SSC & RRB Both' },
  { id: 'number-system', name: 'Number System, Divisibility & Remainder', subject: 'math', scope: 'all', questionCountEstimate: 510, highlight: 'RRB NTPC & SSC Favorite' },
  { id: 'profit-loss', name: 'Profit, Loss, Markup & Discount', subject: 'math', scope: 'all', questionCountEstimate: 460, highlight: 'Universal Exam Must-Solve' },
  { id: 'time-work', name: 'Time, Work, Efficiency & Pipes-Cisterns', subject: 'math', scope: 'all', questionCountEstimate: 390, highlight: 'High Speed Scoring' },
  { id: 'time-speed-distance', name: 'Time, Speed, Distance, Trains & Boats', subject: 'math', scope: 'all', questionCountEstimate: 410, highlight: 'RRB & SSC High Yield' },
  { id: 'percentage', name: 'Percentage, Ratio & Partnership', subject: 'math', scope: 'all', questionCountEstimate: 480, highlight: 'Arithmetic Foundation' },
  { id: 'simple-compound-interest', name: 'Simple & Compound Interest (CI vs SI)', subject: 'math', scope: 'all', questionCountEstimate: 290, highlight: 'Formula & Shortcut Trick' },
  { id: 'average-mixtures', name: 'Average, Mixtures & Alligations', subject: 'math', scope: 'all', questionCountEstimate: 270, highlight: 'Quick Ratio Method' },
  { id: 'data-interpretation', name: 'Data Interpretation (Bar, Pie, Table)', subject: 'math', scope: 'all', questionCountEstimate: 320, highlight: '3-4 Qs Per Shift' },

  // ── General Intelligence & Reasoning ──
  { id: 'series', name: 'Number & Alphabet Series Completion', subject: 'reasoning', scope: 'all', questionCountEstimate: 490, highlight: '3-5 Qs Guaranteed' },
  { id: 'coding-decoding', name: 'Coding-Decoding (Pattern & Matrix)', subject: 'reasoning', scope: 'all', questionCountEstimate: 440, highlight: 'SSC & RRB High Yield' },
  { id: 'analogy', name: 'Analogy & Word/Number Pairs', subject: 'reasoning', scope: 'all', questionCountEstimate: 430, highlight: 'High Frequency' },
  { id: 'syllogism', name: 'Syllogisms & Venn Diagram Logic', subject: 'reasoning', scope: 'all', questionCountEstimate: 360, highlight: '100% Accuracy Rules' },
  { id: 'blood-relations', name: 'Blood Relations (Family Tree & Coded)', subject: 'reasoning', scope: 'all', questionCountEstimate: 310, highlight: 'Coded Relations Practice' },
  { id: 'direction-distance', name: 'Direction & Distance Sense Test', subject: 'reasoning', scope: 'all', questionCountEstimate: 280, highlight: 'Pythagoras Short Trick' },
  { id: 'non-verbal', name: 'Non-Verbal (Paper Folding, Mirror Images)', subject: 'reasoning', scope: 'all', questionCountEstimate: 370, highlight: 'Visual Reasoning Core' },
  { id: 'dice-cubes', name: 'Dice, Cubes & Figure Counting', subject: 'reasoning', scope: 'all', questionCountEstimate: 290, highlight: 'Triangle Counting Rules' },
  { id: 'statement-conclusion', name: 'Statement & Conclusion / Assumptions', subject: 'reasoning', scope: 'rrb', questionCountEstimate: 330, highlight: 'Crucial in RRB NTPC' },

  // ── English Language (SSC Specific) ──
  { id: 'error-spotting', name: 'Spotting the Error (Grammar & Tenses)', subject: 'english', scope: 'ssc', questionCountEstimate: 520, highlight: 'Subject-Verb & Preposition' },
  { id: 'sentence-improvement', name: 'Sentence Improvement & Phrase Replace', subject: 'english', scope: 'ssc', questionCountEstimate: 410, highlight: 'SSC Grammar Rulebook' },
  { id: 'synonyms-antonyms', name: 'Synonyms & Antonyms (Repeated Vocab)', subject: 'english', scope: 'ssc', questionCountEstimate: 580, highlight: 'Past 5-Year High Frequency' },
  { id: 'idioms-phrases', name: 'Idioms, Phrases & Phrasal Verbs', subject: 'english', scope: 'ssc', questionCountEstimate: 430, highlight: 'Scoring Memory Based' },
  { id: 'one-word-substitution', name: 'One Word Substitution (OWS)', subject: 'english', scope: 'ssc', questionCountEstimate: 470, highlight: '100% Repetition Pool' },
  { id: 'spelling-test', name: 'Misspelt Words & Spelling Test', subject: 'english', scope: 'ssc', questionCountEstimate: 290, highlight: 'Quick 2 Marks' },
  { id: 'active-passive-voice', name: 'Active & Passive Voice Transformation', subject: 'english', scope: 'ssc', questionCountEstimate: 310, highlight: 'Tier 2 Mega Booster' },
  { id: 'direct-indirect-speech', name: 'Direct & Indirect Speech (Narration)', subject: 'english', scope: 'ssc', questionCountEstimate: 310, highlight: 'Tier 2 High Weightage' },
  { id: 'cloze-test', name: 'Cloze Test & Reading Passages', subject: 'english', scope: 'ssc', questionCountEstimate: 360, highlight: 'Contextual Comprehension' },

  // ── General Awareness & General Science ──
  { id: 'polity', name: 'Indian Polity, Articles & Amendments', subject: 'ga', scope: 'all', questionCountEstimate: 440, highlight: 'Fundamental Rights & Articles' },
  { id: 'modern-history', name: 'Modern Indian History & National Movement', subject: 'ga', scope: 'all', questionCountEstimate: 390, highlight: 'Governor Generals & Acts' },
  { id: 'ancient-medieval-history', name: 'Ancient & Medieval India (Dynasties & Art)', subject: 'ga', scope: 'all', questionCountEstimate: 320, highlight: 'Mughals, Delhi Sultanate' },
  { id: 'geography', name: 'Indian Geography (Rivers, Mountains, Ports)', subject: 'ga', scope: 'all', questionCountEstimate: 410, highlight: 'River Systems & National Parks' },
  { id: 'general-science-physics-chem', name: 'General Science: Physics & Chemistry', subject: 'ga', scope: 'all', questionCountEstimate: 470, highlight: 'RRB Group D & ALP Top Yield' },
  { id: 'general-science-biology', name: 'General Science: Biology, Diseases & Vitamins', subject: 'ga', scope: 'all', questionCountEstimate: 460, highlight: 'High Frequency Human Body' },
  { id: 'static-gk-culture', name: 'Static GK: Dances, Festivals, Musical Instruments', subject: 'ga', scope: 'all', questionCountEstimate: 510, highlight: 'TCS Pattern Top Trend' },
  { id: 'economy', name: 'Indian Economy, Budget & Five Year Plans', subject: 'ga', scope: 'all', questionCountEstimate: 280, highlight: 'Inflation, RBI & Schemes' }
];
