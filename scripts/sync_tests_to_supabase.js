const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx !== -1) {
    const k = line.substring(0, idx).trim();
    const v = line.substring(idx + 1).trim();
    env[k] = v;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Connecting to Supabase at:', supabaseUrl);

  // 1. Fetch already existing test IDs
  const { data: existing, error: eErr } = await supabase.from('tests').select('id');
  if (eErr) {
    console.error('Error fetching existing tests:', eErr);
    process.exit(1);
  }

  const existingIds = new Set(existing.map(t => t.id));
  console.log('Currently in Supabase tests table:', existingIds.size);

  const testsDir = path.join(__dirname, '..', 'src', 'data', 'tests');
  const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.json'));
  console.log('Total local JSON tests:', files.length);

  const missingFiles = files.filter(f => !existingIds.has(f.replace('.json', '')));
  console.log('Tests to upload to Supabase:', missingFiles.length);

  let successCount = 0;
  let totalQuestionsUploaded = 0;

  for (let i = 0; i < missingFiles.length; i++) {
    const file = missingFiles[i];
    const testId = file.replace('.json', '');
    const filePath = path.join(testsDir, file);

    try {
      const test = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const testRow = {
        id: test.id || testId,
        exam_id: null,
        exam_code: test.examCode || (testId.startsWith('rrb') ? 'rrb-alp-cbt1' : 'ssc-cgl-tier1'),
        title: test.title || testId,
        type: test.type || 'pyq',
        description: test.description || null,
        duration_minutes: test.durationMinutes || 60,
        total_marks: test.totalMarks || 100,
        total_questions: test.totalQuestions || 100,
        is_published: true
      };

      const { error: tErr } = await supabase.from('tests').upsert(testRow);
      if (tErr) {
        console.error(`[${i + 1}/${missingFiles.length}] Error inserting test ${testId}:`, tErr.message);
        continue;
      }

      // Collect all questions
      const qRows = [];
      let qCounter = 1;

      if (Array.isArray(test.sections)) {
        for (const sec of test.sections) {
          if (Array.isArray(sec.questions)) {
            for (const q of sec.questions) {
              const qno = q.qno || qCounter;
              qCounter++;

              const options = Array.isArray(q.options)
                ? q.options.map(opt => ({
                    id: opt.id || opt.num || 1,
                    text_en: opt.text || opt.text_en || '',
                    text_hi: opt.textHi || opt.text_hi || opt.text || ''
                  }))
                : [];

              qRows.push({
                id: `${testRow.id}_q${qno}`,
                test_id: testRow.id,
                section_id: null,
                question_number: qno,
                question_id_str: q.id || null,
                question_text_en: q.questionText || '',
                question_text_hi: q.questionTextHi || q.questionText || '',
                question_images: q.questionImages || [],
                options: options,
                correct_option_index: q.correctOption || 1,
                explanation_en: q.explanation || '',
                explanation_hi: q.explanationHi || q.explanation || '',
                is_bonus: Boolean(q.isBonus)
              });
            }
          }
        }
      }

      // Upsert questions in batches of 50
      for (let b = 0; b < qRows.length; b += 50) {
        const batch = qRows.slice(b, b + 50);
        const { error: qErr } = await supabase.from('questions').upsert(batch);
        if (qErr) {
          console.error(`Error inserting questions batch for ${testId}:`, qErr.message);
        }
      }

      totalQuestionsUploaded += qRows.length;
      successCount++;
      if ((i + 1) % 10 === 0 || i + 1 === missingFiles.length) {
        console.log(`[${i + 1}/${missingFiles.length}] Uploaded: ${testId} (${qRows.length} Qs). Total tests uploaded: ${successCount}`);
      }
    } catch (err) {
      console.error(`Failed to process ${file}:`, err.message);
    }
  }

  console.log(`\n==============================================`);
  console.log(`SUPABASE SYNC COMPLETED SUCCESSFULLY!`);
  console.log(`Tests added: ${successCount}`);
  console.log(`Questions added: ${totalQuestionsUploaded}`);
  console.log(`==============================================\n`);
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
