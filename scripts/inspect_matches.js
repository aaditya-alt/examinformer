const fs = require('fs');

async function inspectMatches() {
  const text = fs.readFileSync('scripts/attempt_payload.txt', 'utf8');

  ['solution', 'correct', 'explanation'].forEach(term => {
    console.log(`\n=== Matches for ${term} ===`);
    let pos = 0;
    while ((pos = text.toLowerCase().indexOf(term, pos)) !== -1) {
      console.log(text.slice(Math.max(0, pos - 100), pos + 200));
      pos += term.length;
    }
  });
}

inspectMatches().catch(console.error);
