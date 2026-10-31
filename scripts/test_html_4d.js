const { fetchTestRaw } = require('./pipeline_utils');
const fs = require('fs');

async function testHtml4d() {
  const html = await fetchTestRaw('ssc-cgl', '6a0f3ef35a73de9e21cdf098');
  fs.writeFileSync('./scripts/shift2.html', html);
  console.log('Saved shift2.html, size:', html.length);

  // Search for "4d:" or "4D:" in raw html
  const idx = html.indexOf('4d:');
  console.log('html.indexOf("4d:"):', idx);
  if (idx !== -1) {
    console.log('Snippet around 4d::', html.substring(idx - 50, idx + 200));
  }
  const idxUpper = html.indexOf('4D:');
  console.log('html.indexOf("4D:"):', idxUpper);
  if (idxUpper !== -1) {
    console.log('Snippet around 4D::', html.substring(idxUpper - 50, idxUpper + 200));
  }
}

testHtml4d().catch(console.error);
