const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncCHSL() {
  console.log('Starting sync of CHSL shifts 2 to 50 questions...');
  let totalInserted = 0;
  for (let shift = 2; shift <= 50; shift++) {
    const filePath = path.resolve(__dirname, '../src/data/tests', `ssc-chsl-2025-shift-${shift}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    const test = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const qList = [];
    test.sections.forEach(sec => {
      sec.questions.forEach(q => {
        qList.push({
          id: q.id,
          test_id: test.id,
          question_number: q.qno,
          question_text_en: q.questionText,
          question_text_hi: q.questionTextHi || '',
          options: q.options.map(o => ({ id: o.id, text_en: o.text, text_hi: o.textHi || '' })),
          correct_option_index: q.correctOption,
          explanation_en: q.explanation || '',
          explanation_hi: q.explanationHi || ''
        });
      });
    });

    for (let i = 0; i < qList.length; i += 50) {
      const batch = qList.slice(i, i + 50);
      const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Shift ${shift} batch error:`, error.message);
      }
    }
    totalInserted += qList.length;
    if (shift % 5 === 0 || shift === 50) {
      console.log(`Synced CHSL shift ${shift}/50 (Total Qs: ${totalInserted})`);
    }
  }
  console.log(`\nCHSL sync complete! Total Qs inserted: ${totalInserted}`);
}

syncCHSL().catch(console.error);
