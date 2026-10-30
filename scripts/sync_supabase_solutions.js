const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const sb = createClient(url, key);

async function syncToSupabase() {
  const bundle = JSON.parse(fs.readFileSync('src/data/mock-tests-bundle.json', 'utf8'));
  console.log(`Starting sync of ${bundle.length} tests, sections and detailed solutions to Supabase...`);

  for (const t of bundle) {
    console.log(`Processing test: ${t.id} (${t.title})...`);

    // 1. Upsert test
    const { error: testErr } = await sb.from('tests').upsert({
      id: t.id,
      title: t.title,
      exam_family: t.examFamily || 'ssc',
      exam_code: t.examCode || 'ssc-cgl',
      test_type: t.type || 'pyq',
      duration_minutes: t.durationMinutes || 60,
      total_marks: t.totalMarks || 200,
      total_questions: t.totalQuestions || 100,
      has_sectional_timing: Boolean(t.hasSectionalTiming),
      sectional_timing_minutes: t.sectionalTimingMinutes || 15,
      is_published: true
    });

    if (testErr) {
      console.warn(`Error upserting test ${t.id}:`, testErr.message);
    }

    // 2. Upsert sections
    for (let sIdx = 0; sIdx < t.sections.length; sIdx++) {
      const sec = t.sections[sIdx];
      // ensure unique secId if missing
      const secId = sec.id || `${t.id}_sec_${sIdx}`;
      sec.id = secId;

      const { error: secErr } = await sb.from('test_sections').upsert({
        id: secId,
        test_id: t.id,
        name: sec.name,
        order_index: sIdx,
        marks_per_question: sec.questions[0]?.marks || 2,
        negative_marks: sec.questions[0]?.negativeMarks || 0.5
      });
      if (secErr) {
        console.warn(`Error upserting section ${secId}:`, secErr.message);
      }
    }

    // 3. Prepare questions batch
    const qBatch = [];
    for (const sec of t.sections) {
      for (const q of sec.questions) {
        qBatch.push({
          id: `${t.id}_${q.qno}`,
          test_id: t.id,
          section_id: sec.id,
          question_number: q.qno,
          question_text_en: q.questionText,
          question_text_hi: q.questionTextHi || null,
          question_images: q.questionImages || [],
          options: q.options || [],
          correct_option_index: q.correctOption,
          explanation_en: q.explanation || '',
          explanation_hi: null,
          is_bonus: false
        });
      }
    }

    // Upsert in batches of 50
    for (let i = 0; i < qBatch.length; i += 50) {
      const slice = qBatch.slice(i, i + 50);
      const { error: qErr } = await sb.from('questions').upsert(slice, { onConflict: 'id' });
      if (qErr) {
        console.warn(`Error upserting questions batch for ${t.id} (${i}-${i + slice.length}):`, qErr.message);
      }
    }
    console.log(`  ✓ Synced ${qBatch.length} questions with full solutions for ${t.id}.`);
  }

  console.log('🎉 All questions, sections, and detailed solutions synced to Supabase successfully!');
}

syncToSupabase();
