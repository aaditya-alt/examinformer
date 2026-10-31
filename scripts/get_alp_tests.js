async function getAlpTests() {
  const alpDetails = await (await fetch('https://api.repeatermock.com/api/v1/test-series/rrb-alp', {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();

  const sec = alpDetails.data?.details?.sections?.find(s => s.name.includes('Previous Year'));
  const sub2025 = sec?.subsections?.find(s => s.name.includes('2025'));

  if (sec && sub2025) {
    const listUrl = `https://api.repeatermock.com/api/v1/test-series/${alpDetails.data.details.id}/sections/${sec.id}/tests?subSectionId=${sub2025.id}&limit=5`;
    const listRes = await (await fetch(listUrl, {
      headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
    })).json();
    console.log('ALP Tests:');
    listRes.data?.forEach(t => console.log(`  - [${t.id}] ${t.title} (${t.questionCount} Qs)`));
  }
}

getAlpTests().catch(console.error);
