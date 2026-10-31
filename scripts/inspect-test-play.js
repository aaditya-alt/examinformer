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

async function inspectPlay() {
  const url = 'https://www.testranking.in/mock-test/instructions/?slug=ssc-cgl-tier-i-2026-free-mock-test-3323285-fm-pts-2';
  const html = await get(url);
  console.log('HTML length:', html.length);
  const scripts = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);
  console.log('Chunks on instructions page:', scripts);

  for (const s of scripts) {
    const js = await get(`https://www.testranking.in${s}`);
    if (js.includes('opsolve.xyz') || js.includes('/questions') || js.includes('attempt') || js.includes('analysis')) {
      const urls = [...js.matchAll(/https:\/\/backend\.opsolve\.xyz\/api\/v1\/[a-zA-Z0-9_\-\/]+/g)].map(m => m[0]);
      if (urls.length) console.log(`In ${s}:`, [...new Set(urls)]);
      
      const endpoints = [...js.matchAll(/["'](\/[a-zA-Z0-9_\-\/]+(?:question|attempt|test|start|play|result|analysis|solution)[a-zA-Z0-9_\-\/]*)["']/g)].map(m => m[1]);
      if (endpoints.length) console.log(`Endpoints in ${s}:`, [...new Set(endpoints)].slice(0, 10));
    }
  }
}

inspectPlay().catch(console.error);
