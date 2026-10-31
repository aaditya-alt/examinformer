async function searchSeries() {
  const queries = ['ssc-cgl', 'chsl', 'cpo', 'mts', 'gd', 'delhi police', 'ntpc', 'alp', 'group d', 'section controller'];
  for (const q of queries) {
    const url = `https://api.repeatermock.com/api/v1/test-series/search?q=${encodeURIComponent(q)}&per_page=5`;
    const res = await fetch(url, {
      headers: {
        'Origin': 'https://repeatermock.com',
        'Referer': 'https://repeatermock.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const json = await res.json();
    console.log(`\nQuery "${q}": found ${json.pagination?.total || 0} series`);
    json.data?.forEach(s => {
      console.log(`  - Slug: ${s.slug} | Name: "${s.name}" | Free: ${s.freeTestCount} | Paid: ${s.paidTestCount} | Platform: ${s.platform}`);
    });
  }
}

searchSeries().catch(console.error);
