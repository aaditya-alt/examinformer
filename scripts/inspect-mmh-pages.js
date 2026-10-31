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
      res.on('end', () => resolve({ status: res.statusCode, url, data }));
    }).on('error', reject);
  });
}

async function inspectPages() {
  const pages = ['/series/', '/exams/', '/live-test/'];
  for (const p of pages) {
    const res = await get(`https://mockmatrixhub.in${p}`);
    console.log(`\n=== Page: ${p} (final: ${res.url}, len: ${res.data.length}) ===`);
    const scripts = [...res.data.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
    console.log('Scripts:', scripts);
    const jsonMatches = [...res.data.matchAll(/(https?:\/\/[^\s"'<>]+\.json|(?:\/|\.\/)[a-zA-Z0-9_\-\/]+\.json)/g)].map(m => m[1]);
    if (jsonMatches.length) console.log('JSONs:', [...new Set(jsonMatches)]);
    const links = [...res.data.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    console.log('Links:', [...new Set(links)].slice(0, 15));
  }
}

inspectPages().catch(console.error);
