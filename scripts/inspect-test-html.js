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

async function inspectTestHtml() {
  const { status, url, data } = await get('https://mockmatrixhub.in/test.html');
  console.log('Final URL:', url, 'Length:', data.length);
  const scripts = [...data.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  console.log('Scripts:', scripts);

  for (const s of scripts) {
    if (s.includes('test') || s.includes('engine') || s.includes('core')) {
      const sUrl = s.startsWith('http') ? s : `https://mockmatrixhub.in${s}`;
      const sRes = await get(sUrl);
      console.log(`\nScript ${s} (len ${sRes.data.length}):`);
      const r2 = [...sRes.data.matchAll(/(https?:\/\/[a-zA-Z0-9_\-\.]+\.(?:r2\.dev|cloudfront\.net|mockmatrixhub\.in|workers\.dev)[^\s"'<>]*)/g)].map(m => m[1]);
      if (r2.length) console.log('Storage/Worker URLs:', [...new Set(r2)]);
      const endpoints = [...sRes.data.matchAll(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
      if (endpoints.length) console.log('Fetches:', [...new Set(endpoints)].slice(0, 10));
    }
  }
}

inspectTestHtml().catch(console.error);
