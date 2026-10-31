async function extractAttempts() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0zwt.o_4iix~3.js');
  const code = await res.text();
  const idx = code.indexOf('attempts:{attemptedTests:');
  console.log('Snippet around attempts:');
  console.log(code.slice(idx, idx + 1200));
}
extractAttempts().catch(console.error);
