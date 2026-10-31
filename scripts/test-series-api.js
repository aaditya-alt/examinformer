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

async function inspectSeries() {
  console.log('Testing category-testseries for SSC...');
  const sscRes = await get('https://backend.opsolve.xyz/api/v1/public/category-testseries?categorySlug=ssc-2');
  console.log('SSC status:', sscRes.status);
  console.log('SSC series:', JSON.stringify(sscRes.json?.data?.testSeries || sscRes.json?.data || sscRes.json, null, 2).slice(0, 2000));

  console.log('\nTesting category-testseries for Railways...');
  const rrbRes = await get('https://backend.opsolve.xyz/api/v1/public/category-testseries?categorySlug=railways-2');
  console.log('Railways status:', rrbRes.status);
  console.log('Railways series:', JSON.stringify(rrbRes.json?.data?.testSeries || rrbRes.json?.data || rrbRes.json, null, 2).slice(0, 2000));
}

inspectSeries().catch(console.error);
