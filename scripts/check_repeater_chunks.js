const fs = require('fs');

async function checkChunks() {
  const html = fs.readFileSync('scripts/repeater_cgl.html', 'utf8');
  const chunkMatches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)];
  const chunkUrls = chunkMatches.map(m => m[1]);
  console.log('Total Chunks:', chunkUrls.length);

  for (const chunk of chunkUrls) {
    try {
      const res = await fetch('https://repeatermock.com' + chunk, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const code = await res.text();
      
      const apis = [...code.matchAll(/["'`](https?:\/\/[^"'`\s]+|\/api\/[^"'`\s]+)["'`]/g)].map(m => m[1]);
      const validApis = apis.filter(a => !a.includes('w3.org') && !a.includes('schema.org') && !a.includes('font') && !a.includes('.png') && !a.includes('.svg') && !a.includes('.js') && !a.includes('.css'));
      
      if (validApis.length > 0) {
        console.log('\n--- Chunk:', chunk);
        console.log('APIs found:', [...new Set(validApis)]);
      }

      // Check if testbook or test URL is mentioned
      const tbMatches = [...code.matchAll(/["'`](https?:\/\/[^"'`\s]*testbook[^"'`\s]*)["'`]/gi)].map(m => m[1]);
      if (tbMatches.length > 0) {
        console.log('Testbook references:', [...new Set(tbMatches)]);
      }
    } catch (e) {
      console.error('Error on chunk', chunk, e.message);
    }
  }
}

checkChunks().catch(console.error);
