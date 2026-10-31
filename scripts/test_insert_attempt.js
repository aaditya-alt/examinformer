const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const dummy = {
    test_id: 'test_sample',
    user_id: 'guest_test',
    candidate_name: 'Test Candidate',
    total_score: 140,
    accuracy: 92,
    time_taken_seconds: 3200,
    responses: {}
  };
  const { data, error } = await supabase.from('test_attempts').insert(dummy).select();
  console.log('Insert result:', data, 'error:', error);
  if (data && data[0]) {
    await supabase.from('test_attempts').delete().eq('id', data[0].id);
    console.log('Cleaned dummy test attempt');
  }
}

testInsert();
