const fs = require('fs');
const html = fs.readFileSync('./scripts/fresh_solution.html', 'utf8');

const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
let match;
const chunks = [];

while ((match = regex.exec(html)) !== null) {
  try {
    const unescaped = JSON.parse(`"${match[2]}"`);
    chunks.push(unescaped);
  } catch (e) {}
}

console.log('Total unescaped chunks:', chunks.length);

// Let's find every occurrence where 35 appears
chunks.forEach((c, idx) => {
  if (c.startsWith('35:') || c.startsWith('35,') || (idx > 40 && idx < 50)) {
    console.log(`Chunk ${idx} length ${c.length}:`, c.substring(0, 100));
  }
});
