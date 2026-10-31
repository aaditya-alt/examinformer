const fs = require('fs');

async function main() {
  const url = 'https://repeatermock.com/tb/test-series/ssc-cgl';
  console.log('Fetching', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  fs.writeFileSync('scripts/repeater_cgl.html', html);
  console.log('Saved repeater_cgl.html, length:', html.length);

  // Search for links or api routes
  const hrefs = html.match(/href="([^"]+)"/g) || [];
  const uniqueHrefs = [...new Set(hrefs.map(h => h.replace(/href="|"/g, '')))];
  console.log('Total unique hrefs:', uniqueHrefs.length);
  const interesting = uniqueHrefs.filter(h => h.includes('test') || h.includes('mock') || h.includes('attempt') || h.includes('cbt') || h.includes('quiz'));
  console.log('Interesting hrefs:', interesting.slice(0, 30));

  // Search for test IDs or API calls
  const apiMatches = html.match(/https?:\/\/[^"'\s]+\/(api|tests|data)[^"'\s]*/g) || [];
  console.log('API matches:', [...new Set(apiMatches)]);
}

main().catch(console.error);
