async function getPreviousSeries() {
  for (const slug of ['ssc-chsl-previous', 'ssc-cpo-previous']) {
    console.log('\n---', slug);
    const d = await (await fetch(`https://api.repeatermock.com/api/v1/test-series/${slug}`, {
      headers: { 'Origin': 'https://repeatermock.com', 'User-Agent': 'Mozilla/5.0' }
    })).json();
    const pyp = d.data?.details?.sections?.find(s => s.name.toLowerCase().includes('previous'));
    console.log('PYP sec:', pyp?.id, pyp?.name);
    pyp?.subsections?.slice(0, 5).forEach(sub => console.log(`  * [${sub.id}] ${sub.name} (${sub.paidTestCount + sub.freeTestCount})`));
  }
}

getPreviousSeries().catch(console.error);
