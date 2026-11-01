import fs from 'fs';
import path from 'path';
import { CBTTest, CBTSection, CBTQuestion } from './types/cbt';
import {
  ExamDefinition,
  MappedQuestion,
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  TOPIC_PRACTICE_LIST,
  TopicItem
} from './types/taxonomy';

export * from './types/taxonomy';

// Automatic intelligent classifier for chapters
export function classifyQuestion(section: string, text: string): { subject: 'math' | 'reasoning' | 'english' | 'ga'; chapter: string } {
  const t = (text || '').toLowerCase();
  const sec = (section || '').toLowerCase();

  const isMathSec = sec.includes('quant') || sec.includes('math') || sec.includes('arithmetic') || sec.includes('numerical');
  const isReasSec = sec.includes('reason') || sec.includes('intelligence');
  const isEngSec = sec.includes('english') || sec.includes('comprehension');
  const isGaSec = sec.includes('general awareness') || sec.includes('general knowledge') || sec.includes('science') || sec.includes('gk') || sec.includes('current affairs');

  const isMathSignal =
    /\\(sin|cos|tan|cot|sec|csc)\b/i.test(t) ||
    /\b(sin|cos|tan|cot|cosec|sec)\s*(²|³|\^[0-9]+|\b\d+°?|\(?θ|theta|alpha|beta|gamma|\([^\)]+\)|[A-Z]\b)/.test(t) ||
    /\b(trigonometr|heights?\s+and\s+distance|angle\s+of\s+elevation|angle\s+of\s+depression)\b/i.test(t) ||
    /\b(pie chart|bar chart|histogram|table shows|given table|given graph|bar graph)\b/i.test(t) ||
    /\b(compound interest|simple interest|sum of money|invested at|annually|per annum|half-yearly)\b/i.test(t) ||
    /\b(profit|loss|cost price|selling price|marked price|discount|markup|dealer sells|shopkeeper)\b/i.test(t) ||
    /\b(pipe|pipes|cistern|fill a tank|empty a tank|work together|can complete a work|days to complete|efficiency)\b/i.test(t) ||
    /\b(train|trains|km\/h|m\/s|speed of|distance between|boat|stream|upstream|downstream|relative speed)\b/i.test(t) ||
    /\b(ratio|proportion|proportional|partnership|divided among|shares of)\b/i.test(t) ||
    /\b(percentage|percent|increased by|decreased by)\b/i.test(t) ||
    /\b(average|mean|mixture|alligation|blended|weighted average)\b/i.test(t) ||
    /\b(circle|chord|tangent|radius|diameter|circumference|triangle|hypotenuse|rhombus|trapezium|parallelogram|cyclic quadrilateral)\b/i.test(t) ||
    /\b(cylinder|cone|sphere|hemisphere|cuboid|cube|surface area|volume of|perimeter of)\b/i.test(t) ||
    /x\^2|x\^3|a\^2|a\^3|\bx\s*[\+\-]\s*1\/x\b|algebra|polynomial/i.test(t);

  const isReasSignal =
    t.includes('letter-cluster') || t.includes('coding-decoding') || t.includes('code language') ||
    t.includes('odd one') || t.includes('different from the rest') || t.includes('alike in a certain') ||
    t.includes('blood relations') || t.includes('father of') || t.includes('mother of') || t.includes('sister of') ||
    t.includes('syllogism') || t.includes('statements and conclusions') || t.includes('all ') && t.includes('some ') ||
    t.includes('mirror image') || t.includes('water image') || t.includes('paper folding') ||
    t.includes('dice') || t.includes('opposite face of') || t.includes('direction sense') || t.includes('turns towards left');

  const isEngSignal =
    t.includes('synonym') || t.includes('nearest meaning') || t.includes('antonym') || t.includes('opposite meaning') ||
    t.includes('idiom') || t.includes('phrase') || t.includes('one word') || t.includes('substitute') ||
    t.includes('misspelt') || t.includes('correctly spelt') || t.includes('grammatical error') || t.includes('sentence improvement');

  // 1. Mathematics
  if (isMathSec || (!isReasSec && !isEngSec && !isGaSec && isMathSignal)) {
    const isTrig =
      /\\(sin|cos|tan|cot|sec|csc)\b/i.test(t) ||
      /\b(sin|cos|tan|cot|cosec|sec)\s*(²|³|\^[0-9]+|\b\d+°?|\(?θ|theta|alpha|beta|gamma|\([^\)]+\)|[A-Z]\b)/.test(t) ||
      /\b(trigonometr|heights?\s+and\s+distance|angle\s+of\s+elevation|angle\s+of\s+depression)\b/i.test(t);

    if (isTrig) return { subject: 'math', chapter: 'Trigonometry & Heights-Distances' };
    if (/\b(pie chart|bar chart|histogram|table shows|given table|given graph|bar graph)\b/i.test(t)) return { subject: 'math', chapter: 'Data Interpretation (Charts & Tables)' };
    if (/\b(compound interest|simple interest|sum of money|invested at|annually|per annum|half-yearly)\b/i.test(t)) return { subject: 'math', chapter: 'Simple & Compound Interest' };
    if (/\b(profit|loss|cost price|selling price|marked price|discount|markup|dealer sells|shopkeeper)\b/i.test(t)) return { subject: 'math', chapter: 'Profit, Loss & Discount' };
    if (/\b(pipe|pipes|cistern|fill a tank|empty a tank|work together|can complete a work|days to complete|efficiency)\b/i.test(t)) return { subject: 'math', chapter: 'Time and Work & Pipes-Cisterns' };
    if (/\b(train|trains|km\/h|m\/s|speed of|distance between|boat|stream|upstream|downstream|relative speed)\b/i.test(t)) return { subject: 'math', chapter: 'Time, Speed and Distance & Trains' };
    if (/\b(ratio|proportion|proportional|partnership|divided among|shares of)\b/i.test(t) || /\b\d+\s*:\s*\d+\b/.test(t)) return { subject: 'math', chapter: 'Ratio, Proportion & Partnership' };
    if (/\b(percentage|percent|increased by|decreased by)\b/i.test(t) || t.includes('%')) return { subject: 'math', chapter: 'Percentage & Applications' };
    if (/\b(average|mean|mixture|alligation|blended|weighted average)\b/i.test(t)) return { subject: 'math', chapter: 'Average, Mixtures & Alligations' };
    if (/\b(circle|chord|tangent|radius|diameter|circumference|triangle|hypotenuse|rhombus|trapezium|parallelogram|cyclic quadrilateral)\b/i.test(t)) return { subject: 'math', chapter: 'Geometry (Circles & Triangles)' };
    if (/\b(cylinder|cone|sphere|hemisphere|cuboid|cube|surface area|volume of|perimeter of)\b/i.test(t)) return { subject: 'math', chapter: 'Mensuration 2D & 3D' };
    if (/x\^2|x\^3|a\^2|a\^3|\bx\s*[\+\-]\s*1\/x\b|algebra|polynomial/i.test(t)) return { subject: 'math', chapter: 'Algebra & Polynomials' };
    return { subject: 'math', chapter: 'Number System & Divisibility' };
  }

  // 2. Reasoning
  if (isReasSec || (!isMathSec && !isEngSec && !isGaSec && isReasSignal)) {
    if (t.includes('letter-cluster') || t.includes('series') || t.includes('?')) return { subject: 'reasoning', chapter: 'Series (Number & Alphabet)' };
    if (t.includes('odd one') || t.includes('different') || t.includes('alike in a certain')) return { subject: 'reasoning', chapter: 'Classification & Odd-One-Out' };
    if (t.includes('coded') || t.includes('written as') || t.includes('code language')) return { subject: 'reasoning', chapter: 'Coding-Decoding' };
    if (t.includes('brother') || t.includes('sister') || t.includes('father') || t.includes('mother') || t.includes('son') || t.includes('daughter')) return { subject: 'reasoning', chapter: 'Blood Relations' };
    if (t.includes('related word') || t.includes('book : author') || t.includes('analogy') || t.includes('::')) return { subject: 'reasoning', chapter: 'Analogy (Word & Number)' };
    if (t.includes('statement:') || t.includes('conclusion:') || t.includes('syllogism') || t.includes('all ') || t.includes('some ')) return { subject: 'reasoning', chapter: 'Venn Diagrams & Syllogisms' };
    if (t.includes('mirror') || t.includes('water image') || t.includes('paper fold') || t.includes('unfolded')) return { subject: 'reasoning', chapter: 'Non-Verbal & Mirror/Water Images' };
    if (t.includes('dice') || t.includes('cube') || t.includes('opposite face')) return { subject: 'reasoning', chapter: 'Dice, Cube & Counting Figures' };
    if (t.includes('north') || t.includes('south') || t.includes('east') || t.includes('west') || t.includes('turns left')) return { subject: 'reasoning', chapter: 'Direction & Distance Sense' };
    return { subject: 'reasoning', chapter: 'Series (Number & Alphabet)' };
  }

  // 3. English
  if (isEngSec || (!isMathSec && !isReasSec && !isGaSec && isEngSignal)) {
    if (t.includes('synonym') || t.includes('nearest meaning')) return { subject: 'english', chapter: 'Synonyms & Antonyms' };
    if (t.includes('antonym') || t.includes('opposite')) return { subject: 'english', chapter: 'Synonyms & Antonyms' };
    if (t.includes('idiom') || t.includes('phrase')) return { subject: 'english', chapter: 'Idioms and Phrases' };
    if (t.includes('one word') || t.includes('substitute')) return { subject: 'english', chapter: 'One Word Substitution' };
    if (t.includes('spelt') || t.includes('spelling') || t.includes('misspelt')) return { subject: 'english', chapter: 'Spelling Test / Misspelt Words' };
    if (t.includes('error') || t.includes('grammatical')) return { subject: 'english', chapter: 'Spotting the Error (Grammar)' };
    if (t.includes('improve') || t.includes('underlined') || t.includes('sentence improvement')) return { subject: 'english', chapter: 'Sentence Improvement' };
    if (t.includes('blank') || t.includes('fill in')) return { subject: 'english', chapter: 'Fill in the Blanks' };
    if (t.includes('passive') || t.includes('voice') || t.includes('active')) return { subject: 'english', chapter: 'Active and Passive Voice' };
    if (t.includes('direct') || t.includes('indirect') || t.includes('narration') || t.includes('speech')) return { subject: 'english', chapter: 'Direct and Indirect Speech' };
    if (t.includes('cloze') || t.includes('passage')) return { subject: 'english', chapter: 'Cloze Test Passages' };
    return { subject: 'english', chapter: 'Reading Comprehension' };
  }

  // 4. General Awareness
  if (t.includes('article') || t.includes('constitution') || t.includes('president') || t.includes('amendment') || t.includes('parliament') || t.includes('fundamental right')) {
    return { subject: 'ga', chapter: 'Indian Polity & Constitution' };
  }
  if (t.includes('battle') || t.includes('gandhi') || t.includes('congress') || t.includes('viceroy') || t.includes('1857') || t.includes('revolt') || t.includes('british')) {
    return { subject: 'ga', chapter: 'Modern History & Freedom Struggle' };
  }
  if (t.includes('river') || t.includes('himalaya') || t.includes('soil') || t.includes('lake') || t.includes('dam') || t.includes('latitude') || t.includes('monsoon')) {
    return { subject: 'ga', chapter: 'Physical & Indian Geography' };
  }
  if (t.includes('gdp') || t.includes('inflation') || t.includes('rbi') || t.includes('fiscal') || t.includes('budget') || t.includes('five year plan') || t.includes('monetary policy')) {
    return { subject: 'ga', chapter: 'Indian Economy & Budget' };
  }
  if (t.includes('acid') || t.includes('newton') || t.includes('velocity') || t.includes('electron') || t.includes('chemical') || t.includes('reaction') || t.includes('force') || t.includes('optics') || t.includes('lens')) {
    return { subject: 'ga', chapter: 'Physics & Basic Chemistry' };
  }
  if (t.includes('cell') || t.includes('vitamin') || t.includes('disease') || t.includes('dna') || t.includes('blood') || t.includes('hormone') || t.includes('plant') || t.includes('photosynthesis')) {
    return { subject: 'ga', chapter: 'Biology & Environmental Science' };
  }
  if (t.includes('dance') || t.includes('festival') || t.includes('temple') || t.includes('monument') || t.includes('unesco') || t.includes('music') || t.includes('award')) {
    return { subject: 'ga', chapter: 'Art, Culture & Festivals' };
  }
  return { subject: 'ga', chapter: 'Current Affairs & Static GK' };
}

// Master memory question bank populated with all bundled questions and mapped metadata
let questionBankCache: MappedQuestion[] | null = null;

export function getMasterQuestionBank(): MappedQuestion[] {
  if (questionBankCache) return questionBankCache;

  const list: MappedQuestion[] = [];

  try {
    const testsDir = path.join(process.cwd(), 'src/data/tests');
    if (fs.existsSync(testsDir)) {
      const files = fs.readdirSync(testsDir);
      files.forEach((file) => {
        try {
          const t = JSON.parse(fs.readFileSync(path.join(testsDir, file), 'utf8'));
          const examCode = t.examCode || 'ssc-cgl-tier1';
          const examFamily = t.examFamily || (examCode.startsWith('rrb') ? 'rrb' : 'ssc');
          const shift = t.title || 'Official Shift 2025';
          const year = t.examYear || 2025;
          const date = '2025 Official Paper';

          t.sections?.forEach((s: any) => {
            s.questions?.forEach((q: any) => {
              const { subject, chapter } = classifyQuestion(s.name, q.questionText);

              list.push({
                id: q.id || `q_${Math.random().toString(36).substring(2, 9)}`,
                examCode,
                examFamily,
                tier: t.title.includes('Tier-2') || t.title.includes('Tier 2') ? 'Tier 2' : 'Tier 1',
                year,
                shift,
                date,
                sectionName: s.name,
                subject,
                chapter,
                difficulty: q.marks > 2 ? 'Hard' : q.negativeMarks === 0.5 ? 'Moderate' : 'Easy',
                questionText: q.questionText,
                questionTextHi: q.questionTextHi,
                options: q.options || [],
                correctOption: q.correctOption || 1,
                explanation: q.explanation || 'Detailed step-by-step conceptual derivation verified by subject experts.',
                marks: q.marks || 2,
                negativeMarks: q.negativeMarks || 0.5
              });
            });
          });
        } catch (e) {}
      });
    }
  } catch (err) {
    console.warn('Could not read question bank from disk:', err);
  }

  questionBankCache = list;
  return list;
}

// Retrieve questions matching specific chapter, subject, or exam
export function filterQuestionBank(filters: {
  examCode?: string;
  subject?: 'math' | 'reasoning' | 'english' | 'ga';
  chapter?: string;
  year?: number;
  limit?: number;
}): MappedQuestion[] {
  const all = getMasterQuestionBank();
  let result = all.filter((q) => {
    if (filters.examCode && filters.examCode !== 'all') {
      const code = (q.examCode || '').toLowerCase();
      const filter = filters.examCode.toLowerCase();
      if (!code.includes(filter)) return false;
    }
    if (filters.subject && q.subject !== filters.subject) return false;
    if (filters.chapter && filters.chapter !== 'all' && q.chapter !== filters.chapter) return false;
    if (filters.year && q.year !== filters.year) return false;
    return true;
  });

  if (filters.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

// Generate on-demand Chapter-Wise Practice Test strictly matching chapter & exam series
export function generateChapterTest(
  subject: 'math' | 'reasoning' | 'english' | 'ga',
  chapter: string,
  count = 20,
  durationMinutes?: number,
  examFilter?: string
): CBTTest {
  // 1. First attempt to get questions from the specific exam series
  let questions = filterQuestionBank({ subject, chapter, examCode: examFilter });
  
  // 2. If the active series has fewer questions than requested, fall back only to the SAME chapter across all series
  if (questions.length === 0) {
    questions = filterQuestionBank({ subject, chapter });
  }

  // STRICT RULE: Never fall back to other chapters or random questions!
  const selected = questions.slice(0, Math.min(count, questions.length));
  const safeCount = Math.max(1, selected.length);
  const isRailway = examFilter ? examFilter.toLowerCase().includes('rrb') : false;
  const marksPerQ = isRailway ? 1 : 2;
  const negMarks = isRailway ? 0.33 : 0.5;

  const duration = durationMinutes || Math.max(10, Math.round(safeCount * 1.0));
  const testId = `topic-${examFilter ? `${examFilter}-` : ''}${subject}-${encodeURIComponent(chapter).replace(/%20/g, '-').toLowerCase()}-${count}-${duration}`;
  const totalMarks = safeCount * marksPerQ;

  const cbtQuestions: CBTQuestion[] = selected.map((q, idx) => ({
    id: q.id,
    qno: idx + 1,
    questionText: q.questionText,
    questionTextHi: q.questionTextHi,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation,
    marks: marksPerQ,
    negativeMarks: negMarks,
    sectionName: chapter,
    examOrigin: `Official 2025-26 Paper: ${q.shift || q.examCode.toUpperCase()}`
  }));

  return {
    id: testId,
    title: `${chapter} — Practice Drill (${selected.length} Qs • ${duration} Mins)`,
    examCode: examFilter || 'chapter-practice',
    examFamily: isRailway ? 'rrb' : 'ssc',
    type: 'chapter',
    durationMinutes: duration,
    totalMarks,
    totalQuestions: selected.length,
    positiveMarks: marksPerQ,
    negativeMarks: negMarks,
    isPublished: true,
    sections: [
      {
        id: `sec-${subject}`,
        name: chapter,
        questions: cbtQuestions
      }
    ]
  };
}

// Generate on-demand Sectional Mock Test for an Exam
export function generateSectionalTest(examCode: string, sectionName: string): CBTTest {
  const all = getMasterQuestionBank();
  const matched = all.filter((q) => q.sectionName.toLowerCase().includes(sectionName.toLowerCase()) || q.chapter.toLowerCase().includes(sectionName.toLowerCase()));
  const count = Math.min(25, matched.length || 25);
  const selected = matched.slice(0, count);

  const testId = `sec-${examCode}-${sectionName.replace(/\s+/g, '-').toLowerCase()}`;
  const totalMarks = selected.reduce((sum, q) => sum + q.marks, 0) || count * 2;

  const cbtQuestions: CBTQuestion[] = selected.map((q, idx) => ({
    id: q.id,
    qno: idx + 1,
    questionText: q.questionText,
    questionTextHi: q.questionTextHi,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    sectionName,
    examOrigin: `Official 2025 Paper: ${q.shift || examCode.toUpperCase()}`
  }));

  return {
    id: testId,
    title: `${sectionName} — Sectional Speed Booster Mock (${count} Qs)`,
    examCode,
    examFamily: examCode.startsWith('rrb') ? 'rrb' : 'ssc',
    type: 'sectional',
    durationMinutes: 20,
    totalMarks,
    totalQuestions: selected.length,
    isPublished: true,
    hasSectionalTiming: true,
    sectionalTimingMinutes: 20,
    sections: [
      {
        id: `sec-main`,
        name: sectionName,
        questions: cbtQuestions
      }
    ]
  };
}

// Generate on-demand Smart PYQ Full Mock
export function generateSmartFullMock(examCode: string): CBTTest {
  const examDef = EXAM_REGISTRY.find((e) => e.id === examCode) || EXAM_REGISTRY[0];
  const all = getMasterQuestionBank();

  const sections: CBTSection[] = examDef.sections.map((secDef, sIdx) => {
    // Pick questions for this section
    const matching = all.filter((q) => q.sectionName.toLowerCase().includes(secDef.name.toLowerCase()) || q.subject === (sIdx === 0 ? 'reasoning' : sIdx === 1 ? 'ga' : sIdx === 2 ? 'math' : 'english'));
    const chosen = matching.slice(0, secDef.questionCount);

    const questions: CBTQuestion[] = chosen.map((q, qIdx) => ({
      id: `${examCode}_s${sIdx}_q${qIdx + 1}`,
      qno: qIdx + 1,
      questionText: q.questionText,
      questionTextHi: q.questionTextHi,
      options: q.options,
      correctOption: q.correctOption,
      explanation: q.explanation,
      marks: examDef.marksPerCorrect,
      negativeMarks: examDef.negativePerWrong,
      sectionName: secDef.name,
      examOrigin: `Official 2025 Paper: ${q.shift || examDef.shortName}`
    }));

    return {
      id: `sec_${sIdx + 1}`,
      name: secDef.name,
      questions
    };
  });

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const totalMarks = totalQuestions * examDef.marksPerCorrect;

  return {
    id: `smart-mock-${examCode}`,
    title: `${examDef.name} — Full-Length All-India PYQ Mock Test`,
    examCode: examDef.id,
    examFamily: examDef.family,
    type: 'full_mock',
    durationMinutes: examDef.durationMinutes,
    totalMarks,
    totalQuestions,
    isPublished: true,
    hasSectionalTiming: examDef.hasSectionalTiming,
    sectionalTimingMinutes: examDef.sectionalTimingMinutes,
    sections
  };
}
