async function inspectSolutionChunks() {
  const chunks = ['00fdonmznjf37.js', '0ykj_90akhor_.js'];
  for (const c of chunks) {
    const res = await fetch('https://repeatermock.com/_next/static/chunks/' + c);
    const code = await res.text();
    console.log(`\nChunk ${c} (len ${code.length}):`);
    
    // search for api endpoints
    const apis = [...code.matchAll(/["'`]((\/(?:tb|test|attempt|api)[^"'`\s]+)|(https?:\/\/[^"'`\s]+))["'`]/g)].map(m => m[1]);
    console.log('APIs:', [...new Set(apis)].slice(0, 10));
    
    // search for solutions or answers
    const idx = code.indexOf('answers');
    if (idx !== -1) {
      console.log('Snippet around answers:');
      console.log(code.slice(Math.max(0, idx - 100), idx + 300));
    }
    
    const sidx = code.indexOf('solution');
    if (sidx !== -1) {
      console.log('Snippet around solution:');
      console.log(code.slice(Math.max(0, sidx - 100), sidx + 300));
    }
  }
}

inspectSolutionChunks().catch(console.error);
