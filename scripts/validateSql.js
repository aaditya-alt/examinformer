const fs = require('fs');

const schema = fs.readFileSync('d:/ERP/mockmatrix/supabase/schema.sql', 'utf8');
const seed = fs.readFileSync('d:/ERP/mockmatrix/supabase/seed.sql', 'utf8');

console.log('Schema lines:', schema.split('\n').length);
console.log('Seed lines:', seed.split('\n').length);

// Check if there are any backslashes in seed.sql that PostgreSQL might complain about or KaTeX LaTeX backslashes
const hasBackslashes = seed.includes('\\');
console.log('Seed contains backslashes (LaTeX):', hasBackslashes);
