const fs = require('fs');
const html = fs.readFileSync('./scripts/shift2.html', 'utf8');

function parseAllRscChunks(html) {
  const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
  let match;
  const rawPushes = [];

  while ((match = regex.exec(html)) !== null) {
    try {
      const unescaped = JSON.parse(`"${match[2]}"`);
      rawPushes.push(unescaped);
    } catch (e) {}
  }

  // Concatenate into the single flight stream
  const fullStream = rawPushes.join('');

  // RSC Flight lines: each entry is `<id>:<tag><payload>` separated by newlines
  // But wait: payload itself can contain newlines!
  // BUT the header `<id>:<tag>` has a specific syntax:
  // `<id>:T<hexLen>,` or `<id>:I[...]` or `<id>:{...}` or `<id>:[...]`
  // For text chunks: `<id>:T<hexLen>,` followed by EXACTLY parseInt(hexLen, 16) characters!
  // Let's test exact flight streaming parser:
  const streamMap = new Map();
  let pos = 0;

  while (pos < fullStream.length) {
    // Match `<id>:` at current position
    const headerMatch = fullStream.slice(pos, pos + 50).match(/^([0-9a-fA-F]+):([A-Za-z0-9_{}\["])/);
    if (!headerMatch) {
      // Advance to next newline
      const nextNl = fullStream.indexOf('\n', pos);
      if (nextNl === -1) break;
      pos = nextNl + 1;
      continue;
    }

    const id = headerMatch[1].toLowerCase();
    const tag = headerMatch[2];
    const colonPos = pos + headerMatch[1].length + 1;

    if (tag === 'T') {
      // Text chunk: `<id>:T<hexLen>,<text of hexLen>`
      const commaPos = fullStream.indexOf(',', colonPos);
      if (commaPos !== -1 && commaPos < colonPos + 20) {
        const hexLen = fullStream.slice(colonPos + 1, commaPos);
        const len = parseInt(hexLen, 16);
        const textStart = commaPos + 1;
        const text = fullStream.slice(textStart, textStart + len);
        streamMap.set(id, text);
        pos = textStart + len;
        if (fullStream[pos] === '\n') pos++;
        continue;
      }
    }

    // For other types (JSON or general)
    const nextNl = fullStream.indexOf('\n', colonPos);
    if (nextNl === -1) {
      streamMap.set(id, fullStream.slice(colonPos));
      break;
    } else {
      streamMap.set(id, fullStream.slice(colonPos, nextNl));
      pos = nextNl + 1;
    }
  }

  return streamMap;
}

const map = parseAllRscChunks(html);
console.log('Total chunks in shift 2:', map.size);
console.log('Value for 4d:', map.get('4d')?.substring(0, 150));
console.log('Value for 4e:', map.get('4e')?.substring(0, 150));
console.log('Value for 49:', map.get('49')?.substring(0, 150));
console.log('Value for 57:', map.get('57')?.substring(0, 150));
console.log('Value for 5d:', map.get('5d')?.substring(0, 150));
