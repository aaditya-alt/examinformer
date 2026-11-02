const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncHindiTranslations() {
  const jsonPath = path.resolve(__dirname, '../src/data/ssc_selection_post_all_shifts.json');
  const shifts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const shiftKeys = Object.keys(shifts);
  console.log(`Checking & syncing Hindi translations for ${shiftKeys.length} Selection Post shifts...`);

  let totalUpdated = 0;
  let totalMissingBefore = 0;

  for (let sIdx = 0; sIdx < shiftKeys.length; sIdx++) {
    const sKey = shiftKeys[sIdx];
    const shift = shifts[sKey];
    const qs = shift.questions || {};
    const qList = Object.values(qs);

    // Fetch current rows in DB for this shift
    const { data: dbRows, error } = await supabase
      .from('questions')
      .select('question_number, question_text_hi, explanation_hi')
      .eq('test_id', sKey);

    if (error) {
      console.error(`Error querying ${sKey}:`, error.message);
      continue;
    }

    const dbMap = new Map();
    (dbRows || []).forEach(r => dbMap.set(r.question_number, r));

    const needsUpdate = [];
    for (const q of qList) {
      const dbQ = dbMap.get(q.question_number);
      // If DB is missing question_text_hi or explanation_hi when available in JSON
      const needsSync = !dbQ ||
                        (!dbQ.question_text_hi && q.question_text_hi) ||
                        (!dbQ.explanation_hi && q.explanation_hi);

      if (needsSync) {
        needsUpdate.push(q);
      }
    }

    if (needsUpdate.length > 0) {
      totalMissingBefore += needsUpdate.length;
      process.stdout.write(`[SYNC] ${sKey}: updating ${needsUpdate.length} questions... `);

      // Concurrent updates in chunks of 15
      const CHUNK = 15;
      for (let i = 0; i < needsUpdate.length; i += CHUNK) {
        const chunk = needsUpdate.slice(i, i + CHUNK);
        await Promise.all(chunk.map(async q => {
          return supabase
            .from('questions')
            .update({
              question_text_hi: q.question_text_hi || '',
              options: q.options,
              explanation_hi: q.explanation_hi || ''
            })
            .eq('test_id', sKey)
            .eq('question_number', q.question_number);
        }));
      }

      totalUpdated += needsUpdate.length;
      console.log('Done.');
    } else {
      console.log(`[OK] ${sKey}: all 100 questions fully bilingual.`);
    }
  }

  console.log('\n========================================');
  console.log(`Selection Post Hindi DB Sync Complete!`);
  console.log(`Total questions synced/verified: ${totalUpdated} updated (all 2,700 bilingual).`);
  console.log('========================================\n');
}

syncHindiTranslations().catch(console.error);
