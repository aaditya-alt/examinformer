async function getNtpcGradTests() {
  const seriesId = '68e4f228d7a12b2c129ae4ea';
  const secId = '68e4f235b05f39376e0b6b1d';
  const sub2025 = '68e51097caa902db070167ce';

  const listUrl = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secId}/tests?subSectionId=${sub2025}&limit=5`;
  const res = await (await fetch(listUrl, {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();
  console.log('NTPC Grad 2025 Tests:');
  res.data?.forEach(t => console.log(`  - [${t.id}] ${t.title} (${t.questionCount} Qs)`));
}
getNtpcGradTests().catch(console.error);
