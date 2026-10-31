async function extractTestGet() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0zwt.o_4iix~3.js');
  const code = await res.text();
  const idx = code.indexOf('tests:{get:');
  console.log('Snippet around tests:{get:');
  console.log(code.slice(idx, idx + 1000));
}
extractTestGet().catch(console.error);
