const bundle = require('../src/data/mock-tests-bundle.json');

const testIssues = {};
for (const t of bundle) {
  let issues = 0;
  for (const s of t.sections) {
    for (const q of s.questions) {
      if ((q.explanation || '').match(/\$[a-f0-9]{2,4}/i)) {
        issues++;
      }
    }
  }
  if (issues > 0) {
    testIssues[t.id] = { title: t.title, issues, total: t.totalQuestions };
  }
}

console.log('Tests with dollar issues:', JSON.stringify(testIssues, null, 2));
