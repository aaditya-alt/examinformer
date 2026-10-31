const fs = require('fs');

async function findAttemptFlow() {
  const html = fs.readFileSync('scripts/repeater_cgl.html', 'utf8');
  const chunkMatches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)];
  const chunkUrls = chunkMatches.map(m => m[1]);

  for (const chunk of chunkUrls) {
    const res = await fetch('https://repeatermock.com' + chunk);
    const code = await res.text();
    if (code.includes('attempt') || code.includes('startTest') || code.includes('/test/')) {
      console.log('Chunk with attempt keywords:', chunk);
      // look for url patterns
      const urls = [...code.matchAll(/["'`]((\/(?:tb|test|attempt|api)[^"'`\s]+)|(https?:\/\/[^"'`\s]+))["'`]/g)].map(m => m[1]);
      const filtered = urls.filter(u => u.includes('test') || u.includes('attempt'));
      if (filtered.length > 0) {
        console.log('  sample urls:', filtered.slice(0, 10));
      }
    }
  }
}

findAttemptFlow().catch(console.error);
