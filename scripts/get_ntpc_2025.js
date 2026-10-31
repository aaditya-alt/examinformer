async function getNtpc2025() {
  const d = await (await fetch('https://api.repeatermock.com/api/v1/test-series/rrb-ntpc', {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();
  const sections = d.data?.details?.sections || [];
  sections.forEach(s => {
    (s.subsections || []).forEach(sub => {
      if (sub.name.includes('2025') || sub.name.includes('PYP') || sub.name.includes('CBT')) {
        console.log(`[${s.id}] -> [${sub.id}] "${s.name} / ${sub.name}" (${sub.paidTestCount + sub.freeTestCount})`);
      }
    });
  });
}
getNtpc2025().catch(console.error);
