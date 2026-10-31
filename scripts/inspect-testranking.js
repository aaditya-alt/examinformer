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

async function inspect() {
  const { data } = await get('https://www.testranking.in/');
  const nextDataMatch = data.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    const nextData = JSON.parse(nextDataMatch[1]);
    console.log('BuildId:', nextData.buildId);
    console.log('Page props keys:', Object.keys(nextData.props?.pageProps || {}));
    console.log('Sample pageProps:', JSON.stringify(nextData.props?.pageProps, null, 2).slice(0, 1500));
  } else {
    console.log('Searching for routes/links in HTML:');
    const links = [...data.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    const uniqueLinks = [...new Set(links)];
    console.log('Links found:', uniqueLinks.filter(l => l.startsWith('/')));

    // Extract next.js manifest or chunks
    const scriptMatches = [...data.matchAll(/src="(\/_next\/static\/[^"]+)"/g)].map(m => m[1]);
    console.log('Next static scripts:', scriptMatches.slice(0, 10));
  }
}

inspect().catch(console.error);
