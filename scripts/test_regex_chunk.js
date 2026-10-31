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

function parseChunksByRegex(stream) {
  const streamMap = new Map();
  // Find all `<id>:T<len>,` in stream
  // Note: an id is 1-6 hex chars, followed by `:T[0-9a-fA-F]+,`
  const headerRegex = /(?:^|\n)([0-9a-fA-F]+):T[0-9a-fA-F]+,/g;
  let matches = [];
  let m;
  while ((m = headerRegex.exec(stream)) !== null) {
    matches.push({
      id: m[1].toLowerCase(),
      headerStart: m.index,
      contentStart: m.index + m[0].length
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    const nextStart = (i + 1 < matches.length) ? matches[i + 1].headerStart : stream.length;
    let content = stream.slice(curr.contentStart, nextStart);
    // Strip trailing newline if any
    if (content.endsWith('\n')) content = content.slice(0, -1);
    streamMap.set(curr.id, content);
  }

  return streamMap;
}

const map = parseChunksByRegex(fullStream);
console.log('Total chunks parsed:', map.size);
console.log('4d exists?', map.has('4d'), 'preview:', map.get('4d')?.substring(0, 100));
console.log('4e exists?', map.has('4e'), 'preview:', map.get('4e')?.substring(0, 100));
console.log('49 exists?', map.has('49'), 'preview:', map.get('49')?.substring(0, 100));
console.log('57 exists?', map.has('57'), 'preview:', map.get('57')?.substring(0, 100));
console.log('5d exists?', map.has('5d'), 'preview:', map.get('5d')?.substring(0, 100));
