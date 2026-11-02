const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncSelectionPost() {
  const filePath = path.resolve(__dirname, '../src/data/ssc_selection_post_all_shifts.json');
  if (!fs.existsSync(filePath)) {
    console.error(`Dataset not found at ${filePath}. Please run build_selection_post_dataset.py first.`);
    return;
  }

  const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const testIds = Object.keys(dataset);
  console.log(`Loaded dataset with ${testIds.length} tests.`);

  let totalTestsUpserted = 0;
  let totalQuestionsUpserted = 0;
  let totalReportsCreated = 0;

  for (let idx = 0; idx < testIds.length; idx++) {
    const tid = testIds[idx];
    const tdata = dataset[tid];
    
    // 1. Upsert test record into 'tests' table
    const testRecord = {
      id: tdata.id,
      exam_code: 'ssc-selection-post',
      title: tdata.title,
      type: 'full',
      description: `Official SSC Selection Post Phase 14 2026 (${tdata.level_display || 'Official'}) Computer-Based Examination held on ${tdata.date_display || 'September 2026'} Shift ${tdata.shift_num || 1}.`,
      duration_minutes: 60,
      total_marks: 200,
      total_questions: 100,
      is_published: true
    };

    const { error: testErr } = await supabase.from('tests').upsert(testRecord, { onConflict: 'id' });
    if (testErr) {
      console.error(`Failed to upsert test ${tid}:`, testErr.message);
      continue;
    } else {
      totalTestsUpserted++;
    }

    // 2. Prepare questions
    const qList = [];
    const reportList = [];
    const qKeys = Object.keys(tdata.questions || {}).map(Number).sort((a, b) => a - b);

    for (const qno of qKeys) {
      const q = tdata.questions[qno];
      qList.push({
        id: q.id,
        test_id: tdata.id,
        question_number: q.question_number,
        section_id: null,
        question_text_en: q.question_text_en,
        question_text_hi: q.question_text_hi || '',
        question_images: [],
        options: q.options,
        correct_option_index: q.correct_option_index,
        explanation_en: q.explanation_en || '',
        explanation_hi: q.explanation_hi || '',
        is_bonus: false
      });

      if (q.has_image) {
        reportList.push({
          id: `rep-${q.id}`,
          test_id: tdata.id,
          test_title: tdata.title,
          question_number: q.question_number,
          question_text: (q.question_text_en || '').slice(0, 500),
          issue_type: 'missing_diagram',
          description: `Diagram/Figure question (${q.section_name}): Official diagram/figure image required.`,
          user_email: 'admin@mockmatrix.com',
          user_id: 'system',
          status: 'pending'
        });
      }
    }

    // Upsert questions in batches of 50
    for (let i = 0; i < qList.length; i += 50) {
      const batch = qList.slice(i, i + 50);
      const { error: qErr } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
      if (qErr) {
        console.error(`Error upserting questions batch for ${tid}:`, qErr.message);
      } else {
        totalQuestionsUpserted += batch.length;
      }
    }

    // Upsert reports
    if (reportList.length > 0) {
      try {
        const { error: repErr } = await supabase.from('question_reports').upsert(reportList, { onConflict: 'id' });
        if (!repErr) {
          totalReportsCreated += reportList.length;
        } else {
          console.warn('Reports upsert note:', repErr.message);
        }
      } catch (err) {
        // Non-blocking
      }
    }

    console.log(`Synced [${idx + 1}/${testIds.length}] ${tdata.title} (${qList.length} Qs, ${reportList.length} diagrams flagged)`);
  }

  console.log(`\n==============================================`);
  console.log(`SYNC COMPLETE:`);
  console.log(`  Tests Upserted: ${totalTestsUpserted}`);
  console.log(`  Questions Upserted: ${totalQuestionsUpserted}`);
  console.log(`  Diagram Reports Raised: ${totalReportsCreated}`);
  console.log(`==============================================`);
}

syncSelectionPost().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
