const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

function cleanWatermark(text) {
  if (!text || typeof text !== 'string') return text || '';
  let s = text;

  // 1. Remove Page markers and header artifacts
  s = s.replace(/\[PAGE_\d+_(?:LEFT|RIGHT)\]/gi, '');
  s = s.replace(/MOCKMATRIX\s*(?:PRACTICE\s*TO\s*PERFECTION)?/gi, '');
  s = s.replace(/PRACTICE\s*TO\s*PERFECTION/gi, '');

  // 2. Remove footer promotional links: YouTube, Telegram, Download App, Visit Website
  s = s.replace(/\b(?:YouTube\s+Telegram|\d+\s+Download\s+App\s+Visit\s+Website|Download\s+App\s+Visit\s+Website|Download\s+App|Visit\s+Website)\s*\d*/gi, '');
  s = s.replace(/YouTube\s+Telegram\s*\d*/gi, '');

  // 3. Remove disclaimer strings: "bsite, and every link redirects to that same website..."
  s = s.replace(/b?\s*site,\s*and\s*every\s*link\s*redirects[\s\S]*?mock\s*test\./gi, '');
  s = s.replace(/If\s+you\s+are\s+reading\s+this[\s\S]*?mock\s*test\./gi, '');
  s = s.replace(/ampered\s*with\s*—\s*those\s*links[\s\S]*?mock\s*test\./gi, '');

  // 4. Remove Table of contents / Jump To leaks
  s = s.replace(/(?:#\s*)?(?:CHAPTER|SUBJECT\s*\/\s*TOPIC)?\s*QS\s*ATTEMPT\s*DIRECT\s*JUMP[\s\S]*?(?=\n\n|\Z)/gi, '');
  s = s.replace(/\d+\s*Click\s+to\s+Attempt\s+Jump\s+To/gi, '');
  s = s.replace(/Click\s+to\s+Attempt\s+Jump\s+To/gi, '');
  s = s.replace(/Click\s+to\s+Attempt/gi, '');
  s = s.replace(/Jump\s+To/gi, '');
  s = s.replace(/PA\s*R\s*T\s*\d+/gi, '');
  s = s.replace(/Attempt\s+Part\s*\d+\s+Mock/gi, '');

  // 5. Remove chapter banner leaks like "CODING (90 Qs)", "ERIES (34 Qs)", "7\nCODING", etc.
  s = s.replace(/\b(?:REASONING|GENERAL\s+AWARENESS|MATHEMATICS|ENGLISH\s+LANGUAGE)\b/gi, '');
  s = s.replace(/\d+\s*\n\s*[A-Z\s&]+\s*\(\d+\s*Qs\)/gi, '');
  s = s.replace(/[A-Z\s&]+\s*\(\d+\s*Qs\)/gi, '');

  // 6. Remove Answer Key grid leaks if attached to option or question
  s = s.replace(/ANSWER\s+KEY[\s\S]*?(?=(?:\d+\s*\([a-d]\)|\Z))/gi, '');
  s = s.replace(/(?:\d+\s*\([a-d]\)\s*){4,}/gi, '');

  // 7. Strip leading "Q.1", "Q.2 " from question text
  s = s.replace(/^Q\.\d+\s*/gi, '');

  // Clean trailing / extra newlines & spaces
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

async function runCleanup() {
  console.log('=== CLEANING LOCAL DATASET ===');
  const jsonPath = path.resolve(__dirname, '../src/data/ssc_selection_post_all_shifts.json');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let localCleaned = 0;
    for (const tid of Object.keys(data)) {
      for (const qno of Object.keys(data[tid].questions)) {
        const q = data[tid].questions[qno];
        q.question_text_en = cleanWatermark(q.question_text_en);
        q.explanation_en = cleanWatermark(q.explanation_en);
        if (Array.isArray(q.options)) {
          q.options.forEach(o => {
            o.text_en = cleanWatermark(o.text_en);
          });
        }
        localCleaned++;
      }
    }
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Cleaned local dataset (${localCleaned} questions).`);
  }

  console.log('\n=== CLEANING SUPABASE DATABASE QUESTIONS ===');
  const { data: selectionTests, error: testErr } = await supabase
    .from('tests')
    .select('id')
    .eq('exam_code', 'ssc-selection-post');

  if (testErr || !selectionTests) {
    console.error('Error fetching tests:', testErr);
    return;
  }

  console.log(`Found ${selectionTests.length} Selection Post tests in Supabase.`);

  let totalUpdated = 0;
  for (const t of selectionTests) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id, question_number, question_text_en, explanation_en, options')
      .eq('test_id', t.id);

    if (!questions || questions.length === 0) continue;

    const updates = [];
    for (const q of questions) {
      const origText = q.question_text_en || '';
      const origExp = q.explanation_en || '';
      const origOpts = JSON.stringify(q.options || []);

      const cleanedText = cleanWatermark(origText);
      const cleanedExp = cleanWatermark(origExp);
      const cleanedOpts = (q.options || []).map(o => ({
        ...o,
        text_en: cleanWatermark(o.text_en || o.text || '')
      }));

      if (
        cleanedText !== origText ||
        cleanedExp !== origExp ||
        JSON.stringify(cleanedOpts) !== origOpts
      ) {
        updates.push({
          id: q.id,
          test_id: t.id,
          question_number: q.question_number,
          question_text_en: cleanedText,
          explanation_en: cleanedExp,
          options: cleanedOpts
        });
      }
    }

    if (updates.length > 0) {
      for (const u of updates) {
        await supabase
          .from('questions')
          .update({
            question_text_en: u.question_text_en,
            explanation_en: u.explanation_en,
            options: u.options
          })
          .eq('id', u.id);
      }
      totalUpdated += updates.length;
      console.log(`Cleaned ${updates.length} questions in ${t.id}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`Database Watermark Cleanup Complete!`);
  console.log(`Total questions sanitized: ${totalUpdated}`);
  console.log(`========================================`);
}

runCleanup().catch(console.error);
