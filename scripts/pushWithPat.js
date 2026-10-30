const fs = require('fs');

async function runWithPat(patToken) {
  const projectId = 'gstoqyvnwpvhciidmigt';
  const url = `https://api.supabase.com/v1/projects/${projectId}/database/query`;

  console.log(`Connecting to Supabase Management API for project ${projectId}...`);
  
  const schemaSql = fs.readFileSync('d:/ERP/mockmatrix/supabase/schema.sql', 'utf8');
  const seedSql = fs.readFileSync('d:/ERP/mockmatrix/supabase/seed.sql', 'utf8');

  const execute = async (name, query) => {
    console.log(`Running ${name}...`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${patToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to execute ${name} (${res.status}): ${errText}`);
    }

    console.log(`✓ ${name} executed successfully!`);
  };

  try {
    await execute('Schema & Tables', schemaSql);
    await execute('Official 150 Questions & Mock Tests', seedSql);
    console.log('✓ All migrations pushed to Supabase 100% successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

const token = process.argv[2];
if (token) {
  runWithPat(token);
} else {
  console.log('Usage: node scripts/pushWithPat.js <sbp_token>');
}

module.exports = { runWithPat };
