const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, text: data.slice(0, 500) });
        }
      });
    }).on('error', reject);
  });
}

async function testBackend() {
  console.log('Testing /public/testseries-categories...');
  const cat = await get('https://backend.opsolve.xyz/api/v1/public/testseries-categories');
  console.log('Categories status:', cat.status);
  console.log('Categories data:', JSON.stringify(cat.json || cat.text, null, 2).slice(0, 1500));
}

testBackend().catch(console.error);
