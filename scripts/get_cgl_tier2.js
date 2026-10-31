async function getCglTier2Tests() {
  const seriesId = '6960d60ab4975a8fe9557df7';
  const secId = '6961139d30978bef2a697b15';
  const sub2025 = '698d76091ec97f4670a8e1da';

  const listUrl = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secId}/tests?subSectionId=${sub2025}&limit=5`;
  const res = await (await fetch(listUrl, {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();
  console.log('CGL Tier-2 2025 Tests:');
  res.data?.forEach(t => console.log(`  - [${t.id}] ${t.title} (${t.questionCount} Qs)`));
}
getCglTier2Tests().catch(console.error);
