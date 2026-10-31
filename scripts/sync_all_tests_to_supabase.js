const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

const bundlePath = path.resolve(__dirname, '../src/data/mock-tests-bundle.json');
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

async function syncAll() {
  console.log(`Starting sync of ${bundle.length} tests to Supabase...`);

  // 1. Upsert all tests in chunks of 20
  for (let i = 0; i < bundle.length; i += 20) {
    const batch = bundle.slice(i, i + 20).map(t => ({
      id: t.id,
      title: t.title,
      exam_code: t.examCode || (t.category === 'rrb' ? 'rrb-ntpc-cbt1' : 'ssc-cgl-tier1'),
      type: t.type || 'pyq',
      total_questions: t.totalQuestions,
      total_marks: t.totalMarks,
      duration_minutes: t.durationMinutes,
      is_published: true
    }));

    const { error } = await supabase.from('tests').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Tests batch ${i} error:`, error.message);
    } else {
      console.log(`Tests batch [${i + 1} - ${Math.min(i + 20, bundle.length)} / ${bundle.length}] synced`);
    }
  }

  // 2. Upsert questions for all tests
  let totalQuestionsCount = 0;
  for (let tIdx = 0; tIdx < bundle.length; tIdx++) {
    const t = bundle[tIdx];
    const qList = [];

    t.sections.forEach(sec => {
      sec.questions.forEach(q => {
        qList.push({
          id: q.id,
          test_id: t.id,
          question_number: q.qno,
          question_text_en: q.questionText,
          question_text_hi: q.questionTextHi || '',
          options: q.options.map(o => ({
            id: o.id,
            text_en: o.text,
            text_hi: o.textHi || ''
          })),
          correct_option_index: q.correctOption,
          explanation_en: q.explanation || '',
          explanation_hi: q.explanationHi || ''
        });
      });
    });

    totalQuestionsCount += qList.length;

    // Delete existing questions for this test and re-insert in chunks of 50
    await supabase.from('questions').delete().eq('test_id', t.id);

    for (let qIdx = 0; qIdx < qList.length; qIdx += 50) {
      const qBatch = qList.slice(qIdx, qIdx + 50);
      const { error: qErr } = await supabase.from('questions').insert(qBatch);
      if (qErr) {
        console.warn(`Error on test ${t.id} questions ${qIdx}:`, qErr.message);
      }
    }

    if ((tIdx + 1) % 10 === 0 || tIdx === bundle.length - 1) {
      console.log(`Synced questions for ${tIdx + 1}/${bundle.length} tests (${totalQuestionsCount} questions total)...`);
    }
  }

  console.log(`\n==============================================`);
  console.log(`SUPABASE SYNC COMPLETE!`);
  console.log(`Total Tests Synced: ${bundle.length}`);
  console.log(`Total Questions Synced: ${totalQuestionsCount}`);
  console.log(`==============================================\n`);
}

syncAll().catch(console.error);
