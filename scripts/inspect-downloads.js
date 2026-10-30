const fs = require('fs');
const path = require('path');

const dir = 'scripts/downloads';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

console.log(`Found ${files.length} test files:`);
for (const file of files) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const meta = raw.meta || {};
    const title = meta.title || raw.title || file;
    let totalQs = 0;
    let sectionNames = [];
    if (raw.sections) {
      sectionNames = Object.keys(raw.sections);
      totalQs = sectionNames.reduce((acc, k) => acc + (raw.sections[k] ? raw.sections[k].length : 0), 0);
    } else if (raw.questions) {
      totalQs = raw.questions.length;
    }
    console.log(`- [${file}] Title: "${title}" | Qs: ${totalQs} | Sections: ${sectionNames.join(', ') || 'single'}`);
  } catch (err) {
    console.error(`- [${file}] Error: ${err.message}`);
  }
}
