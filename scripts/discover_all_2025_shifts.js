const fs = require('fs');

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      'Origin': 'https://repeatermock.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  return res.json();
}

async function discoverAll() {
  const seriesMap = [
    { slug: 'ssc-cgl', exam: 'SSC CGL' },
    { slug: 'ssc-chsl', exam: 'SSC CHSL' },
    { slug: 'ssc-mts', exam: 'SSC MTS' },
    { slug: 'ssc-gd-constable', exam: 'SSC GD' },
    { slug: 'rrb-ntpc', exam: 'RRB NTPC' },
    { slug: 'rrb-alp', exam: 'RRB ALP' }
  ];

  const results = {};

  for (const s of seriesMap) {
    try {
      console.log(`Discovering series ${s.slug}...`);
      const details = await getJson(`https://api.repeatermock.com/api/v1/test-series/${s.slug}`);
      const seriesId = details.data?.details?.id || details.data?.id || details.data?.details?._id;
      const sections = details.data?.details?.sections || [];

      results[s.slug] = {
        seriesId,
        seriesSlug: s.slug,
        exam: s.exam,
        sections: []
      };

      for (const sec of sections) {
        const secInfo = {
          sectionId: sec.id || sec._id,
          name: sec.name,
          subSections: []
        };

        const subs = sec.subsections || sec.subSections || [];
        for (const sub of subs) {
          const subId = sub.id || sub._id;
          const subName = sub.name || '';
          if (subName.includes('2025') || subName.includes('2026') || sec.name.includes('2025') || sec.name.includes('2026') || sec.name.includes('Previous Year Paper')) {
            const listUrl = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secInfo.sectionId}/tests?subSectionId=${subId}&limit=100`;
            const testsRes = await getJson(listUrl);
            const tests = Array.isArray(testsRes.data) ? testsRes.data : (testsRes.data?.tests || []);
            if (tests.length > 0) {
              secInfo.subSections.push({
                subSectionId: subId,
                name: subName,
                testCount: tests.length,
                tests: tests.map(t => ({
                  id: t.id || t._id,
                  title: t.title,
                  questionCount: t.questionCount || t.totalQuestions,
                  totalMark: t.totalMark || t.totalMarks,
                  duration: t.duration || t.durationMinutes
                }))
              });
            }
          }
        }

        // Section directly with tests
        if (subs.length === 0 && (sec.name.includes('2025') || sec.name.includes('2026') || sec.name.includes('Tier II') || sec.name.includes('Previous Year Paper'))) {
          const listUrl = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secInfo.sectionId}/tests?limit=100`;
          const testsRes = await getJson(listUrl);
          const tests = Array.isArray(testsRes.data) ? testsRes.data : (testsRes.data?.tests || []);
          if (tests.length > 0) {
            secInfo.subSections.push({
              subSectionId: null,
              name: sec.name,
              testCount: tests.length,
              tests: tests.map(t => ({
                id: t.id || t._id,
                title: t.title,
                questionCount: t.questionCount || t.totalQuestions,
                totalMark: t.totalMark || t.totalMarks,
                duration: t.duration || t.durationMinutes
              }))
            });
          }
        }

        if (secInfo.subSections.length > 0) {
          results[s.slug].sections.push(secInfo);
        }
      }
    } catch (e) {
      console.error(`Error in series ${s.slug}:`, e.message);
    }
  }

  fs.writeFileSync('./scripts/all_2025_discovered_shifts.json', JSON.stringify(results, null, 2));

  let grandTotal = 0;
  for (const slug in results) {
    const s = results[slug];
    let sCount = 0;
    for (const sec of s.sections) {
      for (const sub of sec.subSections) {
        sCount += sub.testCount;
      }
    }
    console.log(`${slug.toUpperCase()}: ${sCount} shifts found across ${s.sections.length} sections`);
    grandTotal += sCount;
  }
  console.log(`\n========================================`);
  console.log(`GRAND TOTAL OFFICIAL SHIFTS DISCOVERED: ${grandTotal}`);
  console.log(`========================================\n`);
}

discoverAll().catch(console.error);
