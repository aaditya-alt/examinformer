async function find2025Subsections() {
  const seriesList = [
    'ssc-cgl',
    'ssc-chsl',
    'ssc-chsl-previous',
    'ssc-mts',
    'ssc-gd-constable',
    'rrb-alp',
    'rrb-ntpc',
    'rrb-ntpc-ug',
    'rrb-group-d',
    'rrb-je-previous'
  ];

  for (const slug of seriesList) {
    try {
      const res = await fetch(`https://api.repeatermock.com/api/v1/test-series/${slug}`, {
        headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
      });
      const json = await res.json();
      const details = json.data?.details;
      if (!details) continue;

      console.log(`\n========================================`);
      console.log(`SERIES: ${details.name} (slug: ${details.slug}, id: ${details.id})`);
      
      (details.sections || []).forEach(sec => {
        const has2025 = sec.name.includes('2025') || (sec.subsections || []).some(sub => sub.name.includes('2025') || sub.name.includes('2026'));
        const isPYP = sec.name.toLowerCase().includes('previous') || sec.name.toLowerCase().includes('pyp') || sec.name.toLowerCase().includes('paper');
        
        if (has2025 || isPYP) {
          console.log(`  Section: [${sec.id}] ${sec.name}`);
          (sec.subsections || []).forEach(sub => {
            console.log(`    Subsection: [${sub.id}] "${sub.name}" (Tests: ${sub.paidTestCount + sub.freeTestCount})`);
          });
        }
      });
    } catch (e) {
      console.error(`Error on ${slug}:`, e.message);
    }
  }
}

find2025Subsections().catch(console.error);
