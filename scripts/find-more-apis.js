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

async function findMore() {
  const html = await get('https://www.testranking.in/');
  const chunks = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(m => m[1]);

  for (const chunk of chunks) {
    const js = await get(`https://www.testranking.in${chunk}`);
    const v1 = [...js.matchAll(/api\/v1\/([a-zA-Z0-9_\-\/]+)/g)].map(m => m[1]);
    if (v1.length) {
      console.log(`Chunk ${chunk} v1 endpoints:`, [...new Set(v1)]);
    }
  }
}

findMore().catch(console.error);
