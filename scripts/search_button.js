async function searchButton() {
  const html = await (await fetch('https://repeatermock.com/tb/test-series/ssc-cgl')).text();
  const chunkMatches = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+)"/g)].map(m => m[1]);

  for (const chunk of chunkMatches) {
    const code = await (await fetch('https://repeatermock.com' + chunk)).text();
    // Look for Start Now or Take Test or Attempt
    if (code.includes('Start') || code.includes('Attempt') || code.includes('Resume')) {
      const idxs = [...code.matchAll(/(Start Now|Take Test|Start Test|Attempt)/gi)];
      if (idxs.length > 0) {
        console.log(`Chunk ${chunk} has matches:`, idxs.map(i => i[0]));
        // inspect around the first match
        const first = idxs[0].index;
        console.log('Context:', code.slice(Math.max(0, first - 300), first + 300));
      }
    }
  }
}

searchButton().catch(console.error);
