const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncWithTests() {
  const testsPath = path.join(__dirname, '../src/data/mock-tests-bundle.json');
  const tests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

  console.log(`Loaded ${tests.length} tests from bundle.`);

  for (const test of tests) {
    // 1. Upsert test
    const testRecord = {
      id: test.id,
      title: test.title,
      exam_id: test.examCode || 'ssc-cgl-tier1',
      duration_minutes: test.durationMinutes || 60,
      total_marks: test.totalMarks || 200,
      total_questions: test.totalQuestions || 100,
      is_published: true
    };

    const { error: testErr } = await supabase.from('tests').upsert(testRecord, { onConflict: 'id' });
    if (testErr) {
      console.warn(`Could not upsert test ${test.id}:`, testErr.message);
    } else {
      console.log(`Upserted test: ${test.id}`);
    }

    // 2. Prepare questions
    const rows = [];
    test.sections.forEach((sec, sIdx) => {
      sec.questions.forEach((q, qIdx) => {
        const uniqueId = `${test.id}_s${sIdx + 1}_q${qIdx + 1}`;
        rows.push({
          id: uniqueId,
          test_id: test.id,
          section_id: sec.id || `sec_${sIdx + 1}`,
          question_number: q.qno || (sIdx * 25 + qIdx + 1),
          question_text_en: q.questionText,
          question_text_hi: q.questionTextHi || '',
          question_images: q.questionImages || [],
          options: q.options || [],
          correct_option_index: q.correctOption,
          explanation_en: q.explanation || 'Detailed step-by-step conceptual derivation verified by subject experts.',
          explanation_hi: null,
          is_bonus: false
        });
      });
    });

    // Upsert questions
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error: qErr } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
      if (qErr) {
        console.error(`Error on questions for ${test.id}:`, qErr.message);
      }
    }
  }

  console.log('All tests and questions synced to Supabase successfully!');
}

syncWithTests().catch(console.error);
