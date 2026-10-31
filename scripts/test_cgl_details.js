async function fetchDetails() {
  const url = 'https://api.repeatermock.com/api/v1/test-series/ssc-cgl';
  const res = await fetch(url, {
    headers: {
      'Origin': 'https://repeatermock.com',
      'Referer': 'https://repeatermock.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const json = await res.json();
  const d = json.data.details;
  console.log('ID:', d.id);
  console.log('Name:', d.name);
  console.log('Sections:');
  d.sections?.forEach(s => {
    console.log(`- [${s.id}] ${s.name} (tests: ${s.paidTestCount + s.freeTestCount})`);
    s.subsections?.forEach(sub => {
      console.log(`    * [${sub.id}] ${sub.name} (tests: ${sub.paidTestCount + sub.freeTestCount})`);
    });
  });
}

fetchDetails().catch(console.error);
