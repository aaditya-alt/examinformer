async function extractSeries() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0zwt.o_4iix~3.js');
  const code = await res.text();
  const idx = code.indexOf('/test-series/${encodeURIComponent(e)}/sections/${encodeURIComponent(t)}/tests');
  console.log(code.slice(Math.max(0, idx - 1000), idx + 200));
}
extractSeries().catch(console.error);
