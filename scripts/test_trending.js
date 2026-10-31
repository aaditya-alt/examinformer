async function testSeriesEndpoints() {
  const url = 'https://api.repeatermock.com/api/v1/test-series/trending-searches?limit=10';
  console.log('Testing:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'Origin': 'https://repeatermock.com',
        'Referer': 'https://repeatermock.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Trending searches:', json);
  } catch (e) {
    console.error('Failed:', e);
  }
}

testSeriesEndpoints().catch(console.error);
