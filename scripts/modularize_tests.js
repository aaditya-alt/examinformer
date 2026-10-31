const fs = require('fs');
const path = require('path');

const splitFiles = [
  '../src/data/tests-ssc-cgl.json',
  '../src/data/tests-ssc-chsl.json',
  '../src/data/tests-ssc-mts.json',
  '../src/data/tests-rrb.json'
];

const allTests = [];
for (const f of splitFiles) {
  const p = path.resolve(__dirname, f);
  if (fs.existsSync(p)) {
    const list = JSON.parse(fs.readFileSync(p, 'utf8'));
    allTests.push(...list);
  }
}

console.log(`Loaded ${allTests.length} tests to modularize into individual files.`);

const testsDir = path.resolve(__dirname, '../src/data/tests');
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true });
}

const catalog = [];

allTests.forEach(t => {
  // 1. Write individual test JSON file
  const testFile = path.join(testsDir, `${t.id}.json`);
  fs.writeFileSync(testFile, JSON.stringify(t));

  // 2. Add metadata summary to catalog
  catalog.push({
    id: t.id,
    title: t.title,
    examCode: t.examCode || (t.category === 'rrb' ? 'rrb-ntpc-cbt1' : 'ssc-cgl-tier1'),
    examFamily: t.category || (t.id.startsWith('rrb') ? 'rrb' : 'ssc'),
    type: t.type || 'pyq',
    isOfficialPYQ: true,
    examYear: 2025,
    durationMinutes: t.durationMinutes || 60,
    totalQuestions: t.totalQuestions || 100,
    totalMarks: t.totalMarks || 200,
    positiveMarks: t.positiveMarks || 2.0,
    negativeMarks: t.negativeMarks || 0.5,
    sections: t.sections.map(s => ({
      id: s.id,
      name: s.name,
      questionCount: s.questions.length,
      marks: s.questions.reduce((sum, q) => sum + (q.marks || 2), 0)
    }))
  });
});

const catalogPath = path.resolve(__dirname, '../src/data/tests-catalog.json');
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

console.log(`Successfully written ${allTests.length} individual test files in ${testsDir}`);
console.log(`Catalog saved to ${catalogPath} (size: ${(fs.statSync(catalogPath).size / 1024).toFixed(1)} KB)`);

// Clean up the 4 large split files now that individual files are created
splitFiles.forEach(f => {
  const p = path.resolve(__dirname, f);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Removed ${f}`);
  }
});
