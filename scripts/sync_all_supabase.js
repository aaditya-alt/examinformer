const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllToSupabase() {
  const testsPath = path.join(__dirname, '../src/data/mock-tests-bundle.json');
  const tests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

  console.log(`Syncing ${tests.length} official tests to Supabase...`);

  let totalQuestionsUploaded = 0;

  for (const test of tests) {
    console.log(`\nProcessing: [${test.id}] ${test.title}`);

    // 1. Upsert into tests
    const testRow = {
      id: test.id,
      title: test.title,
      exam_code: test.examCode || (test.id.startsWith('cgl') ? 'ssc-cgl' : test.id.startsWith('mts') ? 'ssc-mts' : test.id.startsWith('alp') ? 'rrb-alp' : 'ssc-cgl'),
      type: 'pyq',
      duration_minutes: test.durationMinutes || 60,
      total_marks: test.totalMarks || 200,
      total_questions: test.totalQuestions || 100,
      is_published: true
    };

    const { error: testErr } = await supabase.from('tests').upsert(testRow, { onConflict: 'id' });
    if (testErr) {
      console.error(`  Error upserting test ${test.id}:`, testErr.message);
      continue;
    }

    // 2. Upsert test_sections
    const sectionRows = test.sections.map((s, idx) => ({
      id: `${test.id}_sec_${idx + 1}`,
      test_id: test.id,
      name: s.name,
      order_index: idx,
      marks_per_question: s.questions[0]?.marks || 2,
      negative_marks: s.questions[0]?.negativeMarks || 0.5
    }));

    const { error: secErr } = await supabase.from('test_sections').upsert(sectionRows, { onConflict: 'id' });
    if (secErr) {
      console.error(`  Error upserting sections for ${test.id}:`, secErr.message);
      continue;
    }

    // 3. Upsert questions
    const questionRows = [];
    test.sections.forEach((sec, sIdx) => {
      const sectionDbId = `${test.id}_sec_${sIdx + 1}`;
      sec.questions.forEach((q, qIdx) => {
        questionRows.push({
          id: `${test.id}_q${q.qno || (sIdx * 25 + qIdx + 1)}`,
          test_id: test.id,
          section_id: sectionDbId,
          question_number: q.qno || (sIdx * 25 + qIdx + 1),
          question_text_en: q.questionText,
          question_text_hi: q.questionTextHi || '',
          question_images: q.questionImages || [],
          options: q.options || [],
          correct_option_index: q.correctOption,
          explanation_en: q.explanation || 'Detailed step-by-step solution verified by subject experts.',
          explanation_hi: null,
          is_bonus: false
        });
      });
    });

    for (let i = 0; i < questionRows.length; i += 50) {
      const batch = questionRows.slice(i, i + 50);
      const { error: qErr } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
      if (qErr) {
        console.error(`  Batch error on ${test.id}:`, qErr.message);
      } else {
        totalQuestionsUploaded += batch.length;
      }
    }
  }

  console.log(`\nAll done! Successfully uploaded ${totalQuestionsUploaded} questions to Supabase.`);
}

syncAllToSupabase().catch(console.error);
