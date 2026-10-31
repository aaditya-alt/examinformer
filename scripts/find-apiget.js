const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findApiGet() {
  const html = await get('https://www.testranking.in/');
  const chunks = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(m => m[1]);

  for (const chunk of chunks) {
    const js = await get(`https://www.testranking.in${chunk}`);
    if (js.includes('apiGet') || js.includes('backend.opsolve.xyz')) {
      const idx = js.indexOf('apiGet=');
      const idx2 = js.indexOf('function apiGet');
      const authIdx = js.indexOf('quizapp_token');
      if (idx !== -1 || idx2 !== -1 || authIdx !== -1) {
        console.log(`Found in ${chunk}:`);
        const p = Math.max(idx, idx2, authIdx);
        console.log(js.substring(p - 100, p + 400));
      }
    }
  }
}

findApiGet().catch(console.error);
