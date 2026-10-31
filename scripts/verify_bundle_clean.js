const bundle = require('../src/data/mock-tests-bundle.json');

let exactRscCount = 0;
let strayDollarCount = 0;
const examples = [];

bundle.forEach(t => {
  t.sections.forEach(s => {
    s.questions.forEach(q => {
      const sol = (typeof q.explanation === 'string' ? q.explanation : '') || '';
      if (sol.trim().match(/^\$[0-9a-fA-F]{1,6}$/)) {
        exactRscCount++;
      }
      if (sol.includes('$a') || sol.includes('$b') || sol.includes('$35')) {
        strayDollarCount++;
        if (examples.length < 5) {
          examples.push({ test: t.id, qno: q.qno, sol: sol.substring(0, 150) });
        }
      }
    });
  });
});

console.log('Exact raw RSC flight tokens (^$XX$):', exactRscCount);
console.log('Stray $a, $b, $35 tokens:', strayDollarCount);
console.log('Examples:', JSON.stringify(examples, null, 2));
