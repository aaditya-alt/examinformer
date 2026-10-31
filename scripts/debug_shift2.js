const { fetchTestRaw } = require('./pipeline_utils');
const fs = require('fs');

async function debugShift2() {
  const discovered = require('./all_2025_discovered_shifts.json');
  const cgl2025 = discovered['ssc-cgl'].sections.find(s => s.name.includes('Previous Year Paper (Tier I)')).subSections.find(s => s.name === '2025');
  const test2 = cgl2025.tests[1]; // shift 2
  console.log('Test 2 ID:', test2.id, test2.title);
  const html = await fetchTestRaw('ssc-cgl', test2.id);

  // Look for 4d: or 4D:
  const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
  let match;
  let rawPushes = [];
  while ((match = regex.exec(html)) !== null) {
    try {
      rawPushes.push(JSON.parse(`"${match[2]}"`));
    } catch (e) {}
  }

  console.log('Total pushes in shift 2:', rawPushes.length);
  rawPushes.forEach((p, idx) => {
    if (p.includes('4d:') || p.includes('4D:') || p.includes(':T') && p.includes('4d')) {
      console.log(`Push ${idx} has 4d:`, p.substring(0, 100));
    }
  });
}

debugShift2().catch(console.error);
