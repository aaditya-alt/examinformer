async function getChslTests() {
  const seriesId = '6971ffb9247a3fbd0651f152';
  const secId = '6a6c91c1bb022c692ab312ca';
  const sub2025 = '6a6c91d141f27e3806df81d6';

  const listUrl = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secId}/tests?subSectionId=${sub2025}&limit=6`;
  const res = await (await fetch(listUrl, {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();
  console.log('CHSL 2025 Tests:');
  res.data?.forEach(t => console.log(`  - [${t.id}] ${t.title} (${t.questionCount} Qs)`));
}
getChslTests().catch(console.error);
