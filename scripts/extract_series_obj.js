async function extractSeriesObj() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0zwt.o_4iix~3.js');
  const code = await res.text();
  const idx = code.indexOf('sectionTests:async');
  console.log(code.slice(Math.max(0, idx - 1000), idx + 200));
}
extractSeriesObj().catch(console.error);
