const fs = require('fs');

async function fetchTestInstructions() {
  const url = 'https://repeatermock.com/tb/test-series/ssc-cgl/test/6a0f3ef125f9d428c136a83a/instructions';
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  fs.writeFileSync('scripts/instructions.html', html);
  console.log('Saved instructions.html, length:', html.length);
  
  // Search for links or api calls
  const matches = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log('Links:', matches);
  
  // Search for start test button href or action
  const actions = [...html.matchAll(/(start|attempt|test|instructions)[^\s"'>]+/gi)].map(m => m[0]);
  console.log('Keywords:', [...new Set(actions)].slice(0, 20));
}

fetchTestInstructions().catch(console.error);
