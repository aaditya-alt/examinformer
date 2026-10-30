const { Client } = require('pg');
const fs = require('fs');

async function runDirectSql(dbPassword) {
  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.gstoqyvnwpvhciidmigt.supabase.co:5432/postgres`;
  
  console.log('Connecting to Supabase PostgreSQL at db.gstoqyvnwpvhciidmigt.supabase.co...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully!');

    console.log('Executing schema.sql...');
    const schemaSql = fs.readFileSync('d:/ERP/mockmatrix/supabase/schema.sql', 'utf8');
    await client.query(schemaSql);
    console.log('Schema & tables created successfully!');

    console.log('Executing seed.sql (150 official questions from SSC CGL & RRB NTPC)...');
    const seedSql = fs.readFileSync('d:/ERP/mockmatrix/supabase/seed.sql', 'utf8');
    await client.query(seedSql);
    console.log('150 questions and mock tests seeded successfully into Supabase!');

    const res = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = $1;', ['public']);
    console.log('Public tables now live in Supabase:', res.rows.map(r => r.table_name));

    await client.end();
    console.log('Migration completed 100%!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

// Check if password passed via CLI arg
const pw = process.argv[2];
if (pw) {
  runDirectSql(pw);
} else {
  console.log('Usage: node scripts/pushToSupabase.js <DATABASE_PASSWORD>');
}

module.exports = { runDirectSql };
