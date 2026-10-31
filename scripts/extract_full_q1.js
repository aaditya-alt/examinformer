const fs = require('fs');

async function extractFullQuestion1() {
  const html = fs.readFileSync('scripts/solution_authed.html', 'utf8');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  const s483 = scripts[483];

  const prefix = '<script>self.__next_f.push([1,"';
  const start = s483.indexOf(prefix);
  const end = s483.lastIndexOf('"])</script>');
  const content = s483.substring(start + prefix.length, end);
  const unescaped = JSON.parse(`"${content}"`);

  fs.writeFileSync('scripts/solution_unescaped.txt', unescaped);
  console.log('Saved solution_unescaped.txt, len:', unescaped.length);

  // Search for 6901f8b14d79a5a4a1ddefd0
  const qId = '6901f8b14d79a5a4a1ddefd0';
  let pos = 0;
  while ((pos = unescaped.indexOf(qId, pos)) !== -1) {
    console.log('\n--- Q1 at pos', pos);
    console.log(unescaped.slice(pos, pos + 800));
    pos += qId.length;
  }
}

extractFullQuestion1().catch(console.error);
