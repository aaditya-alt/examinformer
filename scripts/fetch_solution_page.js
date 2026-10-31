const fs = require('fs');

async function fetchSolutionPage() {
  const url = 'https://repeatermock.com/tb/test-series/ssc-cgl/test/6a0f3ef125f9d428c136a83a/solution';
  console.log('Fetching solution page:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  fs.writeFileSync('scripts/solution.html', html);
  console.log('Saved solution.html, length:', html.length);
}

fetchSolutionPage().catch(console.error);
