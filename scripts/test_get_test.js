const fs = require('fs');
const path = require('path');

function testGet(id) {
  let filePath = path.join(process.cwd(), 'src/data/tests', `${id}.json`);
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve(__dirname, '../src/data/tests', `${id}.json`);
  }
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const test = JSON.parse(fileContent);
    return test;
  }
  return null;
}

const t = testGet('ssc-cgl-2025-shift-1');
console.log('Test ssc-cgl-2025-shift-1:');
console.log('Title:', t?.title);
console.log('Sections count:', t?.sections?.length);
console.log('Total questions:', t?.sections?.reduce((a, b) => a + b.questions.length, 0));
console.log('Q1 sample text:', t?.sections?.[0]?.questions?.[0]?.questionText?.substring(0, 100));
