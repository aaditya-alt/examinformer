const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, '..', 'src', 'data', 'tests');
const nonDevRegex = /[\u0C00-\u0C7F\u0C80-\u0CFF\u0B80-\u0BFF\u0980-\u09FF\u0A80-\u0AFF\u0B00-\u0B7F\u0D00-\u0D7F]/;

function cleanText(txt) {
  if (!txt || typeof txt !== 'string') return txt;
  const paras = txt.split('\n');
  const kept = paras.filter(p => !nonDevRegex.test(p));
  return kept.join('\n').trim();
}

console.log('Optimizing all tests in src/data/tests...');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.json'));

let totalBefore = 0;
let totalAfter = 0;
let processed = 0;

for (const f of files) {
  const fp = path.join(testsDir, f);
  const raw = fs.readFileSync(fp, 'utf8');
  totalBefore += raw.length;

  try {
    const data = JSON.parse(raw);
    if (data.sections && Array.isArray(data.sections)) {
      for (const sec of data.sections) {
        if (sec.questions && Array.isArray(sec.questions)) {
          for (const q of sec.questions) {
            if (q.explanationHi) q.explanationHi = cleanText(q.explanationHi);
            if (q.explanation) q.explanation = cleanText(q.explanation);
            if (q.questionTextHi) q.questionTextHi = cleanText(q.questionTextHi);
          }
        }
      }
    }
    const minified = JSON.stringify(data);
    fs.writeFileSync(fp, minified, 'utf8');
    totalAfter += minified.length;
    processed++;
  } catch (err) {
    console.error(`Error processing ${f}:`, err.message);
    totalAfter += raw.length;
  }
}

console.log(`Successfully optimized ${processed} test files!`);
console.log(`Folder size before: ${(totalBefore / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Folder size after:  ${(totalAfter / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Saved ${( (totalBefore - totalAfter) / (1024 * 1024) ).toFixed(2)} MB!`);
