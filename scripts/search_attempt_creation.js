async function searchAttemptCreation() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0gvl6qgmxmb4k.js');
  const code = await res.text();
  
  // Find all /attempts/ endpoints
  const matches = [...code.matchAll(/\/attempts\/[^"'\s\`]+/g)].map(m => m[0]);
  console.log('All /attempts/ matches:');
  console.log([...new Set(matches)]);

  // search for beginDirectAttempt
  const bIdx = code.indexOf('beginDirectAttempt');
  if (bIdx !== -1) {
    console.log('Snippet around beginDirectAttempt:');
    console.log(code.slice(Math.max(0, bIdx - 300), bIdx + 300));
  }
}

searchAttemptCreation().catch(console.error);
