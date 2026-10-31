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

async function fetchJSONs() {
  const files = [
    '/data/series-categories.json',
    '/data/home-config.json',
    '/js/live-mock-engine.js'
  ];

  for (const f of files) {
    const d = await get(`https://mockmatrixhub.in${f}`);
    console.log(`\n=== File: ${f} (len: ${d.length}) ===`);
    console.log(d.slice(0, 1000));
  }
}

fetchJSONs().catch(console.error);
