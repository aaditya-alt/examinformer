const fs = require('fs');
const path = require('path');

const SECTION_DISPLAY_NAMES = {
  'REASONING': 'General Intelligence and Reasoning',
  'GENERAL AWARENESS': 'General Awareness',
  'MATH': 'Quantitative Aptitude',
  'ENGLISH': 'English Comprehension'
};

function formatSections(raw, testId) {
  let globalQno = 1;
  const sections = [];

  if (raw.sections) {
    const secKeys = ['REASONING', 'GENERAL AWARENESS', 'MATH', 'ENGLISH'];
    for (const secKey of secKeys) {
      const qList = raw.sections[secKey] || [];
      const secName = SECTION_DISPLAY_NAMES[secKey] || secKey;
      const questions = qList.map(q => parseQ(q, testId, globalQno++, secName));
      sections.push({
        id: `sec_${secKey.toLowerCase().replace(/\s+/g, '_')}`,
        name: secName,
        questions
      });
    }
  } else if (raw.questions) {
    // Split into 3 sections for NTPC or 1 section
    const qs = raw.questions.map(q => {
      let secName = 'General';
      if (globalQno <= 30) secName = 'Mathematics';
      else if (globalQno <= 60) secName = 'General Intelligence & Reasoning';
      else secName = 'General Awareness';
      return parseQ(q, testId, globalQno++, secName);
    });

    // Group by secName
    const groups = {};
    qs.forEach(q => {
      if (!groups[q.sectionName]) groups[q.sectionName] = [];
      groups[q.sectionName].push(q);
    });
    for (const gName in groups) {
      sections.push({
        id: `sec_${gName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: gName,
        questions: groups[gName]
      });
    }
  }
  return sections;
}

function parseQ(q, testId, qnum, sectionName) {
  const getVal = (v) => {
    if (!v) return '';
    if (typeof v === 'object') return v.en || v.hi || '';
    return String(v);
  };
  const getHi = (v) => {
    if (v && typeof v === 'object' && v.hi) return v.hi;
    return '';
  };

  const textEn = getVal(q.question) || `Question ${qnum}`;
  const textHi = getHi(q.question);

  const options = [
    { id: 1, text: getVal(q.option_1) || 'Option 1', textHi: getHi(q.option_1) },
    { id: 2, text: getVal(q.option_2) || 'Option 2', textHi: getHi(q.option_2) },
    { id: 3, text: getVal(q.option_3) || 'Option 3', textHi: getHi(q.option_3) },
    { id: 4, text: getVal(q.option_4) || 'Option 4', textHi: getHi(q.option_4) }
  ];

  const correctOpt = parseInt(q.answer, 10) || 1;
  const explanation = getVal(q.solution) || '';
  const marks = parseFloat(q.correct_score) || 2;
  const negativeMarks = parseFloat(q.negative_score) || 0.5;

  return {
    id: `${testId}_q_${qnum}`,
    qno: qnum,
    questionText: textEn,
    questionTextHi: textHi,
    options,
    correctOption: correctOpt,
    explanation,
    marks,
    negativeMarks,
    sectionName
  };
}

const testConfigs = [
  {
    file: 'cgl-25-12-sep-s3-full.json',
    id: 'cgl-2025-12-sep-shift-3',
    title: 'SSC CGL 2024/2025 Official Paper (12 Sep Shift 3 - Hardest Shift)',
    examCode: 'ssc-cgl',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 60,
    totalMarks: 200,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 15,
    difficulty: 'hard'
  },
  {
    file: 'cgl_25_18_sept_s3.json',
    id: 'cgl-2025-18-sep-shift-3',
    title: 'SSC CGL 2024/2025 Official Paper (18 Sep Shift 3 - High Difficulty)',
    examCode: 'ssc-cgl',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 60,
    totalMarks: 200,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 15,
    difficulty: 'hard'
  },
  {
    file: 'ssc_cgl_17sep_s2_full.json',
    id: 'cgl-2024-17-sep-shift-2',
    title: 'SSC CGL 2024 Official Paper (17 Sep Shift 2)',
    examCode: 'ssc-cgl',
    examFamily: 'ssc',
    type: 'pyq',
    durationMinutes: 60,
    totalMarks: 200,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 15,
    difficulty: 'medium'
  },
  {
    file: 'ntpc-g-25-math-top-100-1.json',
    id: 'rrb-ntpc-2025-math-top-mock-1',
    title: 'RRB NTPC Graduate 2025 — Mathematics Top 50 Questions Mock',
    examCode: 'rrb-ntpc',
    examFamily: 'rrb',
    type: 'pyq',
    durationMinutes: 45,
    totalMarks: 50,
    hasSectionalTiming: false,
    sectionalTimingMinutes: null,
    difficulty: 'medium'
  },
  {
    file: 'NTPC-100.json',
    id: 'rrb-ntpc-2025-full-mock-1',
    title: 'RRB NTPC Graduate & UG 2025 — Full Length CBT-1 Mock Test',
    examCode: 'rrb-ntpc',
    examFamily: 'rrb',
    type: 'full_mock',
    durationMinutes: 90,
    totalMarks: 100,
    hasSectionalTiming: false,
    sectionalTimingMinutes: null,
    difficulty: 'medium'
  },
  {
    file: 'cgl-25-eng-sentence-improve.json',
    id: 'cgl-2025-eng-sentence-improve',
    title: 'SSC CGL English — Sentence Improvement Master Practice Mock',
    examCode: 'ssc-cgl',
    examFamily: 'ssc',
    type: 'sectional',
    durationMinutes: 45,
    totalMarks: 168,
    hasSectionalTiming: false,
    sectionalTimingMinutes: null,
    difficulty: 'medium'
  }
];

const bundle = testConfigs.map(cfg => {
  const raw = JSON.parse(fs.readFileSync(path.join('scripts/downloads', cfg.file), 'utf8'));
  const sections = formatSections(raw, cfg.id);
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);

  return {
    id: cfg.id,
    title: cfg.title,
    examCode: cfg.examCode,
    examFamily: cfg.examFamily,
    type: cfg.type,
    durationMinutes: cfg.durationMinutes,
    totalMarks: cfg.totalMarks,
    totalQuestions,
    hasSectionalTiming: cfg.hasSectionalTiming,
    sectionalTimingMinutes: cfg.sectionalTimingMinutes,
    difficulty: cfg.difficulty,
    sections
  };
});

fs.writeFileSync('src/data/mock-tests-bundle.json', JSON.stringify(bundle, null, 2), 'utf8');
console.log(`Generated src/data/mock-tests-bundle.json with ${bundle.length} tests and ${bundle.reduce((a, b) => a + b.totalQuestions, 0)} questions!`);
