const fs = require('fs');

async function searchInSolutionHtml() {
  const html = fs.readFileSync('scripts/solution.html', 'utf8');
  console.log('HTML len:', html.length);
  const testId = '6a0f3ef125f9d428c136a83a';
  let pos = 0;
  while ((pos = html.indexOf(testId, pos)) !== -1) {
    console.log('\n--- occurrence at', pos);
    console.log(html.slice(Math.max(0, pos - 150), pos + 300));
    pos += testId.length;
  }
}

searchInSolutionHtml().catch(console.error);
