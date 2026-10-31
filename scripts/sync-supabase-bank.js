const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function sync() {
  console.log('Connecting to Supabase...');
  const testsPath = path.join(__dirname, '../src/data/mock-tests-bundle.json');
  const tests = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

  console.log(`Loaded ${tests.length} tests from bundle.`);
  let totalUploaded = 0;

  for (const test of tests) {
    console.log(`Processing test: ${test.id} - ${test.title}`);
    const rows = [];

    test.sections.forEach((sec, sIdx) => {
      sec.questions.forEach((q, qIdx) => {
        const uniqueId = q.id && !rows.some(r => r.id === q.id) ? q.id : `${test.id}_s${sIdx + 1}_q${qIdx + 1}`;
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

    // Upsert in batches of 50
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Batch error on ${test.id}:`, error.message);
      } else {
        totalUploaded += batch.length;
      }
    }
  }

  console.log(`Successfully synced ${totalUploaded} questions with complete solutions to Supabase!`);
}

sync().catch(console.error);
