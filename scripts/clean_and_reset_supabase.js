const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanSupabase() {
  console.log('Cleaning existing questions and tests from Supabase...');
  
  // 1. Delete questions
  const { error: qErr } = await supabase.from('questions').delete().neq('id', 'keep_none');
  console.log('Deleted questions:', qErr ? qErr.message : 'OK');

  // 2. Delete test_sections
  const { error: sErr } = await supabase.from('test_sections').delete().neq('id', 'keep_none');
  console.log('Deleted test_sections:', sErr ? sErr.message : 'OK');

  // 3. Delete tests
  const { error: tErr } = await supabase.from('tests').delete().neq('id', 'keep_none');
  console.log('Deleted tests:', tErr ? tErr.message : 'OK');

  console.log('Supabase tables successfully cleaned and ready for authentic 2025 PYQ ingestion!');
}

cleanSupabase().catch(console.error);
