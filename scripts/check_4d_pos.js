const fs = require('fs');
const html = fs.readFileSync('./scripts/shift2.html', 'utf8');

const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
let match;
const rawPushes = [];
while ((match = regex.exec(html)) !== null) {
  try {
    rawPushes.push(JSON.parse(`"${match[2]}"`));
  } catch (e) {}
}
const fullStream = rawPushes.join('');

const idx = fullStream.indexOf('4d:');
console.log('fullStream index of 4d::', idx);
if (idx !== -1) {
  console.log('Context around 4d::', fullStream.substring(idx - 20, idx + 100));
}
