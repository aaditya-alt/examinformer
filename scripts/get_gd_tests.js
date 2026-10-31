async function getGdTests() {
  const seriesId = '68e369fddfe41a9c30482098';
  const secId = '68e36a2d10de2287dac9e665';
  const sub2026 = '6a33a06f9420ac682762ac54';

  const listUrl = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secId}/tests?subSectionId=${sub2026}&limit=6`;
  const res = await (await fetch(listUrl, {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();
  console.log('GD Tests (Held in 2026):');
  res.data?.forEach(t => console.log(`  - [${t.id}] ${t.title} (${t.questionCount} Qs)`));
}

getGdTests().catch(console.error);
