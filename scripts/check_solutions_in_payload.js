const fs = require('fs');

async function checkSolutionsInPayload() {
  const text = fs.readFileSync('scripts/attempt_payload.txt', 'utf8');
  console.log('Payload total length:', text.length);

  // Search for keywords
  const keywords = ['solution', 'correct', 'answer', 'ans', 'explanation'];
  for (const kw of keywords) {
    const count = (text.match(new RegExp(kw, 'gi')) || []).length;
    console.log(`Keyword "${kw}": ${count} matches`);
  }

  // Let's print a sample question object structure
  const firstQ = text.indexOf('"_id":"6901f8b14d79a5a4a1ddefd0"');
  if (firstQ !== -1) {
    console.log('Sample Question 1:');
    console.log(text.slice(firstQ, firstQ + 1200));
  }
}

checkSolutionsInPayload().catch(console.error);
