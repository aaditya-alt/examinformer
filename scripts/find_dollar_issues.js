const bundle = require('../src/data/mock-tests-bundle.json');

let count = 0;
for (const t of bundle) {
  for (const s of t.sections) {
    for (const q of s.questions) {
      const match = (q.explanation || '').match(/\$[a-zA-Z0-9_]+/g);
      if (match) {
        count++;
        if (count <= 10) {
          console.log(`\nTest: ${t.id} | Q# ${q.qno} | Matches:`, match);
          console.log('Snippet:', q.explanation.slice(0, 300));
        }
      }
    }
  }
}
console.log('\nTotal questions with dollar sign issues:', count);
