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

async function inspectMMH() {
  const { data } = await get('https://mockmatrixhub.in/');
  console.log('Searching for scripts, APIs, or data in mockmatrixhub.in...');
  const scripts = [...data.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  console.log('Scripts:', scripts);

  const jsonMatches = [...data.matchAll(/(https?:\/\/[^\s"'<>]+\.json|(?:\/|\.\/)[a-zA-Z0-9_\-\/]+\.json)/g)].map(m => m[1]);
  console.log('JSON files found:', [...new Set(jsonMatches)]);

  const links = [...data.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  const pageLinks = [...new Set(links)].filter(l => l.endsWith('.html') || l.startsWith('/'));
  console.log('Page links:', pageLinks.slice(0, 25));
}

inspectMMH().catch(console.error);
