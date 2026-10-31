async function fetch2025Tests() {
  const seriesId = '6960d60ab4975a8fe9557df7'; // CGL series
  const sectionId = '6960ef002ba086d1322b9893'; // PYP Tier 1
  const subSectionId = '6a0f53d9cf23a15bf6d5fef9'; // 2025
  const url = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${sectionId}/tests?subSectionId=${subSectionId}&limit=10`;
  
  console.log('Fetching tests:', url);
  const res = await fetch(url, {
    headers: {
      'Origin': 'https://repeatermock.com',
      'Referer': 'https://repeatermock.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Total tests:', json.total);
  console.log('Sample items:');
  json.data?.forEach(t => {
    console.log(`- ID: ${t.id} | Title: "${t.title}" | Qs: ${t.questionCount} | Marks: ${t.totalMark} | Free: ${t.isFree}`);
  });
}

fetch2025Tests().catch(console.error);
