const fs = require('fs');
const bundle = JSON.parse(fs.readFileSync('src/data/mock-tests-bundle.json', 'utf8'));

bundle.forEach((t, i) => {
  console.log(`Test ${i}: ${t.id} (${t.title})`);
  t.sections.forEach(s => {
    console.log(`  Section: ${s.name} (${s.questions.length} Qs)`);
    if (s.questions.length > 0) {
      console.log(`    Sample Q1: ${s.questions[0].questionText.slice(0, 80).replace(/\n/g, ' ')}`);
    }
  });
});
