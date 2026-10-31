const fs = require('fs');
const html = fs.readFileSync('./scripts/fresh_solution.html', 'utf8');

const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
let match;
const pushes = [];

while ((match = regex.exec(html)) !== null) {
  try {
    const unescaped = JSON.parse(`"${match[2]}"`);
    pushes.push(unescaped);
  } catch (e) {}
}

console.log('Chunk 23:', pushes[23]);
console.log('Chunk 24 length:', pushes[24]?.length);
console.log('Chunk 24 preview:', pushes[24]?.substring(0, 200));
