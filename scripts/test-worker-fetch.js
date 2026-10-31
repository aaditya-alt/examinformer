const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function testWorker() {
  const tests = [
    'https://mmh-attempts-cgl.rankscoremaster.workers.dev/ssc/cgl/full-mock/CGL-2024-09-SEP-SHIFT-1.json',
    'https://mmh-attempts-cgl.rankscoremaster.workers.dev/CGL-2024-09-SEP-SHIFT-1.json',
    'https://mmh-attempts-cgl.rankscoremaster.workers.dev/api/test?id=CGL-2024-09-SEP-SHIFT-1',
    'https://data.mockmatrixhub.in/ssc/cgl/full-mock/CGL-2024-09-SEP-SHIFT-1.json',
    'https://data.mockmatrixhub.in/CGL-2024-09-SEP-SHIFT-1.json'
  ];

  for (const u of tests) {
    const res = await get(u);
    console.log(`URL: ${u} | Status: ${res.status} | Len: ${res.data.length}`);
    if (res.status === 200) {
      console.log('Sample data:', res.data.slice(0, 300));
    }
  }
}

testWorker().catch(console.error);
