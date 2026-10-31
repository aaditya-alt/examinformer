const fs = require('fs');

async function inspectSolutionPayload() {
  const html = fs.readFileSync('scripts/solution_authed.html', 'utf8');
  console.log('Total HTML length:', html.length);

  // Look for testData, answersData, analysisData
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  console.log('Scripts:', scripts.length);

  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    if (s.includes('answersData') || s.includes('solution') || s.includes('correctOption')) {
      console.log(`Script ${i} length: ${s.length}`);
      const idx = s.indexOf('answersData');
      if (idx !== -1) {
        console.log('Snippet around answersData:');
        console.log(s.slice(Math.max(0, idx - 100), idx + 800));
        break;
      }
    }
  }
}

inspectSolutionPayload().catch(console.error);
