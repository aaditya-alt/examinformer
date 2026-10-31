async function inspectMkot() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0mkot9408oh1z.js');
  const code = await res.text();
  console.log('Length:', code.length);
  // find all occurrences of apiPrefix or attempts or questions
  const matches = [...code.matchAll(/(\$\{[^}]*apiPrefix[^}]*\}|\/attempts\/[^"'\s\`]+|\/test[s]?\/[^"'\s\`]+)/g)].map(m => m[1]);
  console.log('Matches in 0mkot:', [...new Set(matches)]);
  
  // print context around apiPrefix
  const idx = code.indexOf('apiPrefix');
  if (idx !== -1) {
    console.log('Context around apiPrefix:');
    console.log(code.slice(Math.max(0, idx - 400), idx + 600));
  }
}
inspectMkot().catch(console.error);
