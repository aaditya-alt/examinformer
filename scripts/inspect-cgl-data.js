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

async function inspectCGL() {
  const d = await get('https://data.mockmatrixhub.in/data/cgl-data.json');
  const json = JSON.parse(d);
  console.log('Keys:', Object.keys(json));
  console.log('Tier1 keys:', Object.keys(json.tier1 || {}));
  console.log('Tier2 keys:', Object.keys(json.tier2 || {}));
  console.log('Years in tier1:', Object.keys(json.tier1?.full_mocks || {}));
  console.log('Sample test in full_mocks:', JSON.stringify(json.tier1?.full_mocks, null, 2).slice(0, 1500));
}

inspectCGL().catch(console.error);
