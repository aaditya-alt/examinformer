const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
    }).on('error', reject);
  });
}

async function inspectPages() {
  console.log('--- Fetching /previous-papers/ ---');
  const pp = await get('https://www.testranking.in/previous-papers/');
  console.log('PP Status:', pp.statusCode);
  const ppLinks = [...pp.data.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log('PP Links:', [...new Set(ppLinks)].filter(l => !l.includes('_next')));

  console.log('\n--- Fetching /test-series/category/?slug=ssc ---');
  const ssc = await get('https://www.testranking.in/test-series/category/?slug=ssc');
  console.log('SSC Status:', ssc.statusCode);
  const sscLinks = [...ssc.data.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log('SSC Links:', [...new Set(sscLinks)].filter(l => !l.includes('_next')));

  console.log('\n--- Fetching /practice/ ---');
  const practice = await get('https://www.testranking.in/practice/');
  console.log('Practice Status:', practice.statusCode);
  const pLinks = [...practice.data.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log('Practice Links:', [...new Set(pLinks)].filter(l => !l.includes('_next')));
}

inspectPages().catch(console.error);
