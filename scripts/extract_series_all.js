async function extractSeriesAll() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0zwt.o_4iix~3.js');
  const code = await res.text();
  const idx = code.indexOf('trendingSearches:async');
  console.log(code.slice(Math.max(0, idx - 1500), idx));
}
extractSeriesAll().catch(console.error);
