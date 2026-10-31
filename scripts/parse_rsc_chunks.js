const fs = require('fs');
const html = fs.readFileSync('./scripts/fresh_solution.html', 'utf8');

const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
let match;
const chunks = new Map();

while ((match = regex.exec(html)) !== null) {
  const content = match[2];
  // Find lines starting with id:
  // Note: content is string-escaped
  try {
    const unescaped = JSON.parse(`"${content}"`);
    // RSC chunks format: <id>:<type><data>
    // e.g. "35:T884,..." or "35:I[...]"
    const colonIdx = unescaped.indexOf(':');
    if (colonIdx > 0 && colonIdx < 10) {
      const id = unescaped.substring(0, colonIdx);
      const rest = unescaped.substring(colonIdx + 1);
      chunks.set(id, rest);
    }
  } catch (e) {
    // raw string
  }
}

console.log('Total chunks parsed:', chunks.size);
console.log('Chunk 35:', chunks.get('35')?.substring(0, 300));
console.log('Chunk 36:', chunks.get('36')?.substring(0, 300));
console.log('Chunk 37:', chunks.get('37')?.substring(0, 300));
