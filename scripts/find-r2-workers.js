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

async function findWorkers() {
  const html = await get('https://mockmatrixhub.in/test');
  const urls = [...html.matchAll(/https?:\/\/[a-zA-Z0-9_\-\.]+\.(?:r2\.dev|cloudflarestorage\.com|workers\.dev)[^\s"'<>]*/g)].map(m => m[0]);
  console.log('Worker/R2 matches:', [...new Set(urls)]);
}

findWorkers().catch(console.error);
