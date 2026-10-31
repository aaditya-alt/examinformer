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

async function inspectScripts() {
  const files = ['/auth.js', '/js/live-json.js', '/js/home-engine.js', '/js/app-core.js'];
  for (const f of files) {
    const js = await get(`https://mockmatrixhub.in${f}`);
    console.log(`\n=== ${f} (length: ${js.length}) ===`);
    // Find Supabase config, API URLs, test data URLs
    const supabaseMatches = js.match(/supabaseUrl\s*=\s*['"][^'"]+['"]|https:\/\/[a-z0-9]+\.supabase\.co/gi);
    if (supabaseMatches) console.log('Supabase URLs in ' + f + ':', supabaseMatches);

    const jsonMatches = [...js.matchAll(/(https?:\/\/[^\s"'<>]+\.json|(?:\/|\.\/)[a-zA-Z0-9_\-\/]+\.json)/g)].map(m => m[1]);
    if (jsonMatches.length) console.log('JSONs in ' + f + ':', [...new Set(jsonMatches)]);

    const fetchMatches = [...js.matchAll(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
    if (fetchMatches.length) console.log('Fetches in ' + f + ':', [...new Set(fetchMatches)]);
  }
}

inspectScripts().catch(console.error);
