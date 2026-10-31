async function listMoreTests() {
  const seriesToInspect = [
    { slug: 'ssc-chsl', name: 'CHSL' },
    { slug: 'ssc-cpo', name: 'CPO' },
    { slug: 'ssc-mts', name: 'MTS' },
    { slug: 'ssc-gd-constable', name: 'GD' },
    { slug: 'rrb-ntpc', name: 'NTPC' },
    { slug: 'rrb-alp', name: 'ALP' }
  ];

  for (const s of seriesToInspect) {
    console.log(`\n=== Series: ${s.slug} ===`);
    try {
      const url = `https://api.repeatermock.com/api/v1/test-series/${s.slug}`;
      const res = await fetch(url, {
        headers: {
          'Origin': 'https://repeatermock.com',
          'Referer': 'https://repeatermock.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const json = await res.json();
      const sections = json.data?.details?.sections || [];
      console.log(`Found ${sections.length} sections for ${s.slug}:`);
      sections.slice(0, 5).forEach(sec => {
        console.log(`  - [${sec.id}] ${sec.name}`);
        sec.subsections?.slice(0, 4).forEach(sub => {
          console.log(`      * [${sub.id}] ${sub.name} (tests: ${sub.paidTestCount + sub.freeTestCount})`);
        });
      });
    } catch (e) {
      console.log(`Error on ${s.slug}:`, e.message);
    }
  }
}

listMoreTests().catch(console.error);
