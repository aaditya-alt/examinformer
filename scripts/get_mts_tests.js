async function getMtsTests() {
  const seriesId = '6a7c7e084c87ee270f35d8fc'; // let's check ssc-mts details id
  const sscMtsDetails = await (await fetch('https://api.repeatermock.com/api/v1/test-series/ssc-mts', {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();

  const sec = sscMtsDetails.data?.details?.sections?.find(s => s.name.includes('Previous Year'));
  console.log('MTS PYP section:', sec?.id);
  const sub2025 = sec?.subsections?.find(s => s.name.includes('2025') || s.name.includes('2024'));
  console.log('MTS Sub 2025:', sub2025?.id, sub2025?.name);

  if (sec && sub2025) {
    const listUrl = `https://api.repeatermock.com/api/v1/test-series/${sscMtsDetails.data.details.id}/sections/${sec.id}/tests?subSectionId=${sub2025.id}&limit=5`;
    const listRes = await (await fetch(listUrl, {
      headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
    })).json();
    console.log('MTS Tests:');
    listRes.data?.forEach(t => console.log(`  - [${t.id}] ${t.title} (${t.questionCount} Qs)`));
  }
}

getMtsTests().catch(console.error);
