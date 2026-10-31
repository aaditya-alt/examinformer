const fs = require('fs');

async function searchAnalysis() {
  const html = fs.readFileSync('scripts/attempt.html', 'utf8');
  const chunkMatches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);

  for (const chunk of chunkMatches) {
    const code = await (await fetch('https://repeatermock.com' + chunk)).text();
    if (code.includes('analysis') || code.includes('solutions') || code.includes('result')) {
      const urls = [...code.matchAll(/["'`]((\/(?:tb|test|attempt|api|analysis)[^"'`\s]+))["'`]/g)].map(m => m[1]);
      const interesting = urls.filter(u => u.includes('analysis') || u.includes('solution') || u.includes('answer') || u.includes('result'));
      if (interesting.length > 0) {
        console.log(`Chunk ${chunk}:`, [...new Set(interesting)]);
      }
    }
  }
}

searchAnalysis().catch(console.error);
