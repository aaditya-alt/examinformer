const fs = require('fs');
const path = require('path');

// 1. Process SSC CGL Test
const cglRaw = JSON.parse(fs.readFileSync('d:/ERP/mockmatrix/cgl-25-12-sep-s3-full.json', 'utf8'));

const sscSections = [];
const sscSectionOrder = ['REASONING', 'GENERAL AWARENESS', 'MATH', 'ENGLISH'];
const sscSectionDisplayNames = {
  'REASONING': 'General Intelligence and Reasoning',
  'GENERAL AWARENESS': 'General Awareness',
  'MATH': 'Quantitative Aptitude',
  'ENGLISH': 'English Comprehension'
};

let globalQno = 1;
for (const secKey of sscSectionOrder) {
  const qList = cglRaw.sections[secKey] || [];
  const questions = qList.map((q, idx) => {
    const qnum = globalQno++;
    const questionTextEn = (typeof q.question === 'object' ? q.question.en : q.question) || `Question ${qnum}`;
    const questionTextHi = (typeof q.question === 'object' ? q.question.hi : '') || '';

    const options = [
      { id: 1, text: (typeof q.option_1 === 'object' ? q.option_1.en : q.option_1) || 'Option 1', textHi: (typeof q.option_1 === 'object' ? q.option_1.hi : '') },
      { id: 2, text: (typeof q.option_2 === 'object' ? q.option_2.en : q.option_2) || 'Option 2', textHi: (typeof q.option_2 === 'object' ? q.option_2.hi : '') },
      { id: 3, text: (typeof q.option_3 === 'object' ? q.option_3.en : q.option_3) || 'Option 3', textHi: (typeof q.option_3 === 'object' ? q.option_3.hi : '') },
      { id: 4, text: (typeof q.option_4 === 'object' ? q.option_4.en : q.option_4) || 'Option 4', textHi: (typeof q.option_4 === 'object' ? q.option_4.hi : '') }
    ];

    const correctOpt = parseInt(q.answer, 10) || 1;
    const explanation = (typeof q.solution === 'object' ? q.solution.en || q.solution.hi : q.solution) || '';

    return {
      id: `cgl_q_${qnum}`,
      qno: qnum,
      questionText: questionTextEn,
      questionTextHi,
      options,
      correctOption: correctOpt,
      explanation,
      marks: 2,
      negativeMarks: 0.5,
      sectionName: sscSectionDisplayNames[secKey]
    };
  });

  sscSections.push({
    id: `sec_${secKey.toLowerCase().replace(/\s+/g, '_')}`,
    name: sscSectionDisplayNames[secKey],
    questions
  });
}

const cglCbtTest = {
  id: 'cgl-2025-12-sep-shift-3',
  title: 'SSC CGL 2024/2025 Official Paper (12 Sep Shift 3 - Hardest Shift)',
  examCode: 'ssc-cgl',
  examFamily: 'ssc',
  type: 'pyq',
  durationMinutes: 60,
  totalMarks: 200,
  totalQuestions: 100,
  isPublished: true,
  sections: sscSections
};

// 2. Process RRB NTPC Math Test
const ntpcRaw = JSON.parse(fs.readFileSync('d:/ERP/mockmatrix/ntpc-g-25-math-top-100-1.json', 'utf8'));

const ntpcQuestions = ntpcRaw.questions.map((q, idx) => {
  const qnum = idx + 1;
  const questionTextEn = (typeof q.question === 'object' ? q.question.en : q.question) || `Math Question ${qnum}`;
  const questionTextHi = (typeof q.question === 'object' ? q.question.hi : '') || '';

  const options = [
    { id: 1, text: (typeof q.option_1 === 'object' ? q.option_1.en : q.option_1) || 'Option 1', textHi: (typeof q.option_1 === 'object' ? q.option_1.hi : '') },
    { id: 2, text: (typeof q.option_2 === 'object' ? q.option_2.en : q.option_2) || 'Option 2', textHi: (typeof q.option_2 === 'object' ? q.option_2.hi : '') },
    { id: 3, text: (typeof q.option_3 === 'object' ? q.option_3.en : q.option_3) || 'Option 3', textHi: (typeof q.option_3 === 'object' ? q.option_3.hi : '') },
    { id: 4, text: (typeof q.option_4 === 'object' ? q.option_4.en : q.option_4) || 'Option 4', textHi: (typeof q.option_4 === 'object' ? q.option_4.hi : '') }
  ];

  const correctOpt = parseInt(q.answer, 10) || 1;
  const explanation = (typeof q.solution === 'object' ? q.solution.en || q.solution.hi : q.solution) || '';

  return {
    id: `ntpc_q_${qnum}`,
    qno: qnum,
    questionText: questionTextEn,
    questionTextHi,
    options,
    correctOption: correctOpt,
    explanation,
    marks: 1,
    negativeMarks: 0.33,
    sectionName: 'Mathematics'
  };
});

const ntpcCbtTest = {
  id: 'rrb-ntpc-2025-math-top-mock-1',
  title: 'RRB NTPC Graduate 2025 — Mathematics Top 50 Questions Mock',
  examCode: 'rrb-ntpc',
  examFamily: 'rrb',
  type: 'live',
  durationMinutes: 45,
  totalMarks: 50,
  totalQuestions: 50,
  isPublished: true,
  sections: [
    {
      id: 'sec_ntpc_math',
      name: 'Mathematics',
      questions: ntpcQuestions
    }
  ]
};

// Write out JSON bundle
fs.writeFileSync('d:/ERP/mockmatrix/src/data/mock-tests-bundle.json', JSON.stringify([cglCbtTest, ntpcCbtTest], null, 2), 'utf8');
console.log('Successfully generated src/data/mock-tests-bundle.json with 2 full official tests (150 questions total)!');
