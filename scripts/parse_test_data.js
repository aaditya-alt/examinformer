const fs = require('fs');

async function parseTestData() {
  const html = fs.readFileSync('scripts/attempt.html', 'utf8');
  // Match next_f push that contains testData
  const match = html.match(/"testData":(\{.*\}),"questionsCount"/s) || html.match(/"testData":(\{.*\}),"userStatus"/s) || html.match(/"testData":(\{.*?\})\n/s);

  // Or let's extract the string passed to self.__next_f.push
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,"(.*?)"\]\)/gs)];
  console.log('Pushes found:', pushes.length);

  for (let i = 0; i < pushes.length; i++) {
    const raw = pushes[i][1];
    if (raw.includes('"testData":')) {
      console.log(`Push #${i} length: ${raw.length}`);
      // Unescape json string
      const unescaped = JSON.parse(`"${raw}"`);
      // Find testData
      const idx = unescaped.indexOf('"testData":');
      console.log('testData start:', idx);
      // Let's find sections
      const secIdx = unescaped.indexOf('"sections":[');
      console.log('sections start:', secIdx);
      console.log(unescaped.slice(secIdx, secIdx + 800));
    }
  }
}

parseTestData().catch(console.error);
