const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

function sanitizeStr(s) {
  if (!s || typeof s !== 'string') return s || '';
  return s.replace(/\0/g, '').replace(/\\u0000/g, '');
}

async function fixSingle() {
  const filePath = path.resolve(__dirname, '../src/data/ssc_selection_post_all_shifts.json');
  const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const tid = 'ssc-selection-post-phase-14-12th-23sep-shift-2';
  const tdata = dataset[tid];

  const qList = [];
  const qKeys = Object.keys(tdata.questions || {}).map(Number).sort((a, b) => a - b);

  for (const qno of qKeys) {
    const q = tdata.questions[qno];
    qList.push({
      id: q.id,
      test_id: tdata.id,
      question_number: q.question_number,
      section_id: null,
      question_text_en: sanitizeStr(q.question_text_en),
      question_text_hi: sanitizeStr(q.question_text_hi),
      question_images: [],
      options: q.options.map(o => ({
        id: o.id,
        text_en: sanitizeStr(o.text_en),
        text_hi: sanitizeStr(o.text_hi)
      })),
      correct_option_index: q.correct_option_index,
      explanation_en: sanitizeStr(q.explanation_en),
      explanation_hi: sanitizeStr(q.explanation_hi),
      is_bonus: false
    });
  }

  for (let i = 0; i < qList.length; i += 25) {
    const batch = qList.slice(i, i + 25);
    const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`Batch ${i} error:`, error.message);
    } else {
      console.log(`Successfully synced batch ${i} to ${i + batch.length} of ${tid}`);
    }
  }
}

fixSingle().catch(console.error);
