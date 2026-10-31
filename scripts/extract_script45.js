const fs = require('fs');

async function extractScript45() {
  const html = fs.readFileSync('scripts/attempt.html', 'utf8');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  const s45 = scripts[45];
  console.log('Script 45 length:', s45.length);

  // It starts with <script>self.__next_f.push([1,"...
  // Let's strip <script>self.__next_f.push([1," and trailing "] ) </script>
  const prefix = '<script>self.__next_f.push([1,"';
  const start = s45.indexOf(prefix);
  const end = s45.lastIndexOf('"])</script>');
  const content = s45.substring(start + prefix.length, end);
  
  // Unescape
  const unescaped = JSON.parse(`"${content}"`);
  console.log('Unescaped length:', unescaped.length);

  const idx = unescaped.indexOf('"testData":');
  console.log('Index of "testData":', idx);
  console.log(unescaped.slice(idx, idx + 1000));

  fs.writeFileSync('scripts/attempt_payload.txt', unescaped);
  console.log('Saved attempt_payload.txt');
}

extractScript45().catch(console.error);
