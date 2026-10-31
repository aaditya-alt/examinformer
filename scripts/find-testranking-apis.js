const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findApis() {
  const html = await get('https://www.testranking.in/');
  const chunks = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(m => m[1]);
  console.log(`Found ${chunks.length} chunks. Searching for API endpoints...`);

  for (const chunk of chunks.slice(0, 15)) {
    const js = await get(`https://www.testranking.in${chunk}`);
    const matches = [...js.matchAll(/backend\.opsolve\.xyz\/([a-zA-Z0-9_\-\/]+)/g)].map(m => m[1]);
    const apiEndpoints = [...js.matchAll(/"(\/api\/[a-zA-Z0-9_\-\/]+)"/g)].map(m => m[1]);
    if (matches.length > 0 || apiEndpoints.length > 0) {
      console.log(`Chunk ${chunk}:`);
      if (matches.length) console.log('  opsolve matches:', [...new Set(matches)]);
      if (apiEndpoints.length) console.log('  api matches:', [...new Set(apiEndpoints)]);
    }
  }
}

findApis().catch(console.error);
