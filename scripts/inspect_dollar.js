const data = require('../src/data/mock-tests-bundle.json');
let count = 0;
let examples = [];

data.forEach(t => {
  t.sections.forEach(s => {
    s.questions.forEach(q => {
      ['en', 'hi'].forEach(lang => {
        const sol = q.explanation?.[lang] || '';
        if (sol.includes('$')) {
          count++;
          if (examples.length < 5) {
            examples.push({
              test: t.title,
              qno: q.qno,
              sol: sol.substring(0, 200)
            });
          }
        }
      });
    });
  });
});

console.log('Total explanations containing dollar sign:', count);
console.log('Examples:\n', JSON.stringify(examples, null, 2));
