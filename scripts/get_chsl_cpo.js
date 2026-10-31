async function getChslCpoTests() {
  // 1. CPO
  const cpoDetails = await (await fetch('https://api.repeatermock.com/api/v1/test-series/ssc-cpo', {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();
  console.log('CPO sections count:', cpoDetails.data?.details?.sections?.length);

  // 2. CHSL
  const chslDetails = await (await fetch('https://api.repeatermock.com/api/v1/test-series/ssc-chsl', {
    headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
  })).json();
  const chslSec = chslDetails.data?.details?.sections?.find(s => s.name.includes('Previous Year'));
  console.log('CHSL PYP sec:', chslSec?.id);
  chslSec?.subsections?.forEach(sub => console.log(`  * [${sub.id}] ${sub.name}`));
}

getChslCpoTests().catch(console.error);
