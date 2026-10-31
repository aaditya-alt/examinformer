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

async function findOpsolveEndpoints() {
  const html = await get('https://www.testranking.in/');
  const chunks = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(m => m[1]);

  for (const chunk of chunks) {
    const js = await get(`https://www.testranking.in${chunk}`);
    const quotes = [...js.matchAll(/["'](\/[a-zA-Z0-9_\-\/]+)["']/g)].map(m => m[1]);
    const filtered = quotes.filter(q => 
      q.includes('test') || q.includes('exam') || q.includes('quiz') || 
      q.includes('question') || q.includes('rank') || q.includes('analysis') || 
      q.includes('category') || q.includes('chapter') || q.includes('paper')
    );
    if (filtered.length) {
      console.log(`Endpoints in ${chunk}:`, [...new Set(filtered)].slice(0, 10));
    }
  }
}

findOpsolveEndpoints().catch(console.error);
