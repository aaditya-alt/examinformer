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

async function inspectChunk() {
  const js = await get('https://www.testranking.in/_next/static/chunks/117oc_yreffjm.js');
  console.log('Chunk length:', js.length);

  const startIdx = js.indexOf('mocktest-start');
  if (startIdx !== -1) {
    console.log('--- Context around mocktest-start ---');
    console.log(js.substring(startIdx - 200, startIdx + 500));
  }

  const resultIdx = js.indexOf('mocktest-result');
  if (resultIdx !== -1) {
    console.log('--- Context around mocktest-result ---');
    console.log(js.substring(resultIdx - 200, resultIdx + 500));
  }
}

inspectChunk().catch(console.error);
