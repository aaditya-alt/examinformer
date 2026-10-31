const fs = require('fs');
const html = fs.readFileSync('./scripts/fresh_solution.html', 'utf8');

function parseFlightPayload(html) {
  const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
  let match;
  const rawPushes = [];

  while ((match = regex.exec(html)) !== null) {
    try {
      const unescaped = JSON.parse(`"${match[2]}"`);
      rawPushes.push(unescaped);
    } catch (e) {}
  }

  // Next.js RSC flight chunks are streamed.
  // A chunk header looks like: `<hexId>:<type><info>,`
  // e.g. `35:T884,` followed by the string data of length hex 884.
  // Or `37:T50d,...` where the data starts right after the comma.
  // Or `14:{"answersData":...}`
  
  // Let's concatenate all text and parse the flight stream
  // In RSC stream: stream is a sequence of entries:
  // Each entry starts with `<id>:<tag><payload>\n` or similar.
  // Actually, pushes are chunks of one single stream!
  const fullStream = rawPushes.join('');
  
  // Now let's parse all IDs from fullStream!
  // Entries in flight: `<id>:<type><data>`
  // Types:
  // - `T<hexLen>,<text>`: string of length hexLen
  // - `I[...]`: module reference
  // - `{...}` or `[...]`: JSON object
  // Let's create an id-to-value dictionary
  const dict = new Map();

  // Regex to find start of chunks:
  // In RSC stream, entries are formatted as:
  // `<id>:<rest>` where <id> is hex or number.
  // But wait, the fullStream might have multiple lines or entries.
  // Let's see how entries are separated in fullStream!
  return { rawPushes, fullStream };
}

const { rawPushes, fullStream } = parseFlightPayload(html);
console.log('fullStream length:', fullStream.length);

// Let's find all entries in rawPushes
const streamMap = new Map();
let currentId = null;
let currentRemaining = 0;
let currentBuffer = '';

for (let i = 0; i < rawPushes.length; i++) {
  const p = rawPushes[i];
  
  // Check if p starts with `<id>:`
  const m = p.match(/^([0-9a-fA-F]+):([A-Z])([0-9a-fA-F]*),(.*)/s);
  const mJson = p.match(/^([0-9a-fA-F]+):([{\[])/s);

  if (m) {
    const id = m[1];
    const type = m[2]; // 'T'
    const lenHex = m[3];
    const len = lenHex ? parseInt(lenHex, 16) : 0;
    const content = m[4];
    
    streamMap.set(id, content);
    currentId = id;
  } else if (currentId && streamMap.has(currentId)) {
    // Continuation of previous chunk
    streamMap.set(currentId, streamMap.get(currentId) + p);
  }
}

console.log('Total streamMap entries:', streamMap.size);
console.log('Value for ID 35:', streamMap.get('35')?.substring(0, 150));
console.log('Value for ID 36:', streamMap.get('36')?.substring(0, 150));
console.log('Value for ID 37:', streamMap.get('37')?.substring(0, 150));
console.log('Value for ID 3d:', streamMap.get('3d')?.substring(0, 150));
