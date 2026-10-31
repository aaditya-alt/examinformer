const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = res.headers.location.startsWith('http') ? res.headers.location : `https://mockmatrixhub.in${res.headers.location}`;
        return resolve(get(nextUrl));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findTestFetch() {
  const html = await get('https://mockmatrixhub.in/test');
  console.log('HTML size:', html.length);

  // Search for fetch / R2 / Cloudflare / questions in the HTML
  const fetches = [...html.matchAll(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
  console.log('Fetches in test HTML:', [...new Set(fetches)]);

  const r2Matches = [...html.matchAll(/(https?:\/\/[a-zA-Z0-9_\-\.]+\.(?:r2\.dev|cloudfront\.net|mockmatrixhub\.in|workers\.dev)[^\s"'<>]*)/g)].map(m => m[1]);
  console.log('R2/Storage matches:', [...new Set(r2Matches)]);

  const testUrlMatches = [...html.matchAll(/(https?:\/\/[^\s"'<>]+\/data\/[^\s"'<>]+)/g)].map(m => m[1]);
  console.log('Data URL matches:', [...new Set(testUrlMatches)]);
}

findTestFetch().catch(console.error);
