async function getGdDetails() {
  const res = await fetch(`https://api.repeatermock.com/api/v1/test-series/ssc-gd-constable`, {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  });
  const json = await res.json();
  const d = json.data?.details;
  console.log('GD details:', d?.id, d?.name);
  (d.sections || []).forEach(s => {
    console.log(`- [${s.id}] ${s.name}`);
    (s.subsections || []).forEach(sub => console.log(`    * [${sub.id}] "${sub.name}" (${sub.paidTestCount + sub.freeTestCount})`));
  });
}
getGdDetails().catch(console.error);
