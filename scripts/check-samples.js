const fs = require('fs');

const ntpc = JSON.parse(fs.readFileSync('scripts/downloads/NTPC-100.json', 'utf8'));
console.log('NTPC keys:', Object.keys(ntpc));
if (ntpc.questions) {
  console.log('NTPC sample Q:', JSON.stringify(ntpc.questions[0]).slice(0, 300));
}

const cgl18 = JSON.parse(fs.readFileSync('scripts/downloads/cgl_25_18_sept_s3.json', 'utf8'));
console.log('CGL 18 keys:', Object.keys(cgl18));
if (cgl18.sections) {
  const firstSec = Object.keys(cgl18.sections)[0];
  console.log('CGL 18 first section:', firstSec, 'sample Q:', JSON.stringify(cgl18.sections[firstSec][0]).slice(0, 300));
}
