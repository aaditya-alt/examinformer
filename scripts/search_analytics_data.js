const fs = require('fs');

async function searchAnalyticsData() {
  const text = fs.readFileSync('scripts/solution_unescaped.txt', 'utf8');

  // Find analysisData or questionStats or accuracy
  const keywords = ['analysisData', 'accuracy', 'percentage', 'topper', 'avg', 'average', 'summary'];
  keywords.forEach(kw => {
    const idx = text.indexOf(kw);
    console.log(`Keyword "${kw}" found at:`, idx);
    if (idx !== -1) {
      console.log(text.slice(Math.max(0, idx - 50), idx + 300));
    }
  });
}

searchAnalyticsData().catch(console.error);
