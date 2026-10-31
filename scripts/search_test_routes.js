async function searchTestRoutes() {
  // Let's check sitemap or all chunks for route definitions like /test/ or /attempt/ or /take/
  const res = await fetch('https://repeatermock.com/sitemap.xml');
  const text = await res.text();
  const locs = [...text.matchAll(/<loc>(https:\/\/repeatermock\.com\/[^<]+)<\/loc>/g)].map(m => m[1]);
  const sampleNonSeries = locs.filter(l => !l.includes('/test-series'));
  console.log('Sample non-series locs:', sampleNonSeries.slice(0, 30));
}

searchTestRoutes().catch(console.error);
