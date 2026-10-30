const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const EXAM_IDS = {
  cgl: '118c6158-90d6-4f10-a8cf-07bf80137604',
  ntpc: 'fdf82caa-337d-4c69-9933-d3ae9f9a02c2',
};

const SECTION_DISPLAY_NAMES = {
  'REASONING': 'General Intelligence and Reasoning',
  'GENERAL AWARENESS': 'General Awareness',
  'MATH': 'Quantitative Aptitude',
  'ENGLISH': 'English Comprehension'
};

function formatQuestions(rawQuestionsOrSections, testId) {
  const formatted = [];
  let qnum = 1;

  if (rawQuestionsOrSections.sections) {
    const secKeys = ['REASONING', 'GENERAL AWARENESS', 'MATH', 'ENGLISH'];
    for (const key of secKeys) {
      const qList = rawQuestionsOrSections.sections[key] || [];
      const secName = SECTION_DISPLAY_NAMES[key] || key;
      for (const q of qList) {
        formatted.push(parseQuestion(q, testId, qnum++, secName));
      }
    }
  } else if (rawQuestionsOrSections.questions) {
    for (const q of rawQuestionsOrSections.questions) {
      let secName = 'General';
      if (qnum <= 30) secName = 'Mathematics';
      else if (qnum <= 60) secName = 'General Intelligence & Reasoning';
      else secName = 'General Awareness';
      formatted.push(parseQuestion(q, testId, qnum++, secName));
    }
  }
  return formatted;
}

function parseQuestion(q, testId, qnum, sectionName) {
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
    { id: 1, text_en: getVal(q.option_1) || 'Option 1', text_hi: getHi(q.option_1) },
    { id: 2, text_en: getVal(q.option_2) || 'Option 2', text_hi: getHi(q.option_2) },
    { id: 3, text_en: getVal(q.option_3) || 'Option 3', text_hi: getHi(q.option_3) },
    { id: 4, text_en: getVal(q.option_4) || 'Option 4', text_hi: getHi(q.option_4) }
  ];

  const correctOption = parseInt(q.answer, 10) || 1;
  const explanation = getVal(q.solution) || '';

  return {
    id: `${testId}_q_${qnum}`,
    test_id: testId,
    question_number: qnum,
    question_text_en: textEn,
    question_text_hi: textHi,
    options: options,
    correct_option_index: correctOption,
    explanation_en: explanation,
    explanation_hi: ''
  };
}

async function pushTest(testRecord, questions) {
  console.log(`\nPushing Test: [${testRecord.id}] ${testRecord.title}...`);
  
  // 1. Upsert test
  const { error: tErr } = await supabase.from('tests').upsert(testRecord, { onConflict: 'id' });
  if (tErr) {
    console.error(`Error saving test ${testRecord.id}:`, tErr.message);
    return;
  }
  console.log(`  -> Saved test meta successfully.`);

  // 2. Delete existing questions for this test to avoid stale duplicates
  await supabase.from('questions').delete().eq('test_id', testRecord.id);

  // 3. Batch insert questions in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < questions.length; i += chunkSize) {
    const chunk = questions.slice(i, i + chunkSize);
    const { error: qErr } = await supabase.from('questions').insert(chunk);
    if (qErr) {
      console.error(`  -> Error inserting questions batch ${i}-${i+chunk.length}:`, qErr.message);
    } else {
      console.log(`  -> Inserted questions ${i + 1} to ${Math.min(i + chunkSize, questions.length)}`);
    }
  }
  console.log(`  -> Finished inserting ${questions.length} questions for ${testRecord.id}`);
}

async function runAll() {
  const testsToPush = [
    {
      file: 'cgl_25_18_sept_s3.json',
      id: 'cgl-2025-18-sep-shift-3',
      exam_id: EXAM_IDS.cgl,
      exam_code: 'ssc-cgl',
      title: 'SSC CGL 2024/2025 Official Paper (18 Sep Shift 3 - High Difficulty)',
      total_marks: 200,
      duration_minutes: 60,
      type: 'pyq',
      is_published: true
    },
    {
      file: 'ssc_cgl_17sep_s2_full.json',
      id: 'cgl-2024-17-sep-shift-2',
      exam_id: EXAM_IDS.cgl,
      exam_code: 'ssc-cgl',
      title: 'SSC CGL 2024 Official Paper (17 Sep Shift 2)',
      total_marks: 200,
      duration_minutes: 60,
      type: 'pyq',
      is_published: true
    },
    {
      file: 'NTPC-100.json',
      id: 'rrb-ntpc-2025-full-mock-1',
      exam_id: EXAM_IDS.ntpc,
      exam_code: 'rrb-ntpc',
      title: 'RRB NTPC Graduate & UG 2025 — Full Length CBT-1 Mock Test',
      total_marks: 100,
      duration_minutes: 90,
      type: 'full_mock',
      is_published: true
    },
    {
      file: 'cgl-25-eng-sentence-improve.json',
      id: 'cgl-2025-eng-sentence-improve',
      exam_id: EXAM_IDS.cgl,
      exam_code: 'ssc-cgl',
      title: 'SSC CGL English — Sentence Improvement Master Practice Mock',
      total_marks: 168,
      duration_minutes: 45,
      type: 'sectional',
      is_published: true
    }
  ];

  for (const item of testsToPush) {
    const raw = JSON.parse(fs.readFileSync(path.join('scripts/downloads', item.file), 'utf8'));
    const questions = formatQuestions(raw, item.id);
    const testRecord = {
      id: item.id,
      exam_id: item.exam_id,
      exam_code: item.exam_code,
      title: item.title,
      type: item.type,
      total_questions: questions.length,
      total_marks: item.total_marks,
      duration_minutes: item.duration_minutes,
      is_published: item.is_published
    };
    await pushTest(testRecord, questions);
  }

  // Also update cgl-2025-12-sep-shift-3 title and settings
  await supabase.from('tests').update({
    title: 'SSC CGL 2024/2025 Official Paper (12 Sep Shift 3 - Hardest Shift)',
    duration_minutes: 60
  }).eq('id', 'cgl-2025-12-sep-shift-3');

  console.log('\nAll tests and questions pushed to Supabase successfully!');
}

runAll().catch(console.error);
