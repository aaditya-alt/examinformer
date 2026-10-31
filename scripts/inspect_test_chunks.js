async function inspectTestChunks() {
  const chunks = [
    '/_next/static/chunks/0c1hbxpq9wfb_.js',
    '/_next/static/chunks/156ff.-5u~0oj.js',
    '/_next/static/chunks/0gvl6qgmxmb4k.js'
  ];

  for (const c of chunks) {
    const res = await fetch('https://repeatermock.com' + c);
    const code = await res.text();
    console.log(`\nChunk ${c} (len ${code.length}):`);
    
    // search for submit redirect or analysis URL
    const idx = code.indexOf('/submit');
    if (idx !== -1) {
      console.log('Snippet around /submit:');
      console.log(code.slice(Math.max(0, idx - 200), idx + 400));
    }
    
    // search for analysis or solutions
    const analysisIdx = code.indexOf('analysis');
    if (analysisIdx !== -1) {
      console.log('Snippet around analysis:');
      console.log(code.slice(Math.max(0, analysisIdx - 100), analysisIdx + 300));
    }
  }
}

inspectTestChunks().catch(console.error);
