const fs = require('fs');
const path = require('path');

const bundlePath = path.resolve(__dirname, '../src/data/mock-tests-bundle.json');
const d = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

const cgl = d.filter(t => t.id.startsWith('ssc-cgl'));
const chsl = d.filter(t => t.id.startsWith('ssc-chsl') || t.examCode?.includes('chsl'));
const mts = d.filter(t => t.id.startsWith('ssc-mts') || t.examCode?.includes('mts'));
const rrb = d.filter(t => t.id.startsWith('rrb-') || t.category === 'rrb');

fs.writeFileSync(path.resolve(__dirname, '../src/data/tests-ssc-cgl.json'), JSON.stringify(cgl));
fs.writeFileSync(path.resolve(__dirname, '../src/data/tests-ssc-chsl.json'), JSON.stringify(chsl));
fs.writeFileSync(path.resolve(__dirname, '../src/data/tests-ssc-mts.json'), JSON.stringify(mts));
fs.writeFileSync(path.resolve(__dirname, '../src/data/tests-rrb.json'), JSON.stringify(rrb));

console.log('Successfully created split test bundle JSON files:');
console.log(`- tests-ssc-cgl.json (${cgl.length} tests)`);
console.log(`- tests-ssc-chsl.json (${chsl.length} tests)`);
console.log(`- tests-ssc-mts.json (${mts.length} tests)`);
console.log(`- tests-rrb.json (${rrb.length} tests)`);
