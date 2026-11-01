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

async function discoverRrbTests() {
  const targetSeries = [
    { slug: 'rrb-ntpc-ug', name: 'RRB NTPC Under Graduate 2025-26' },
    { slug: 'rrb-ntpc', name: 'RRB NTPC Graduate 2025-26' },
    { slug: 'rrb-group-d', name: 'RRB Group D 2025-26' },
    { slug: 'rrb-section-controller', name: 'RRB Section Controller 2025-26' },
    { slug: 'rrb-alp', name: 'RRB ALP 2025-26' }
  ];

  const results = {};

  for (const s of targetSeries) {
    console.log(`\nDiscovering tests for ${s.name} (${s.slug})...`);
    results[s.slug] = {
      name: s.name,
      slug: s.slug,
      categories: []
    };

    const details = await getJson(`https://api.repeatermock.com/api/v1/test-series/${s.slug}`);
    const seriesId = details.data?.details?.id || details.data?.details?._id;
    const sections = details.data?.details?.sections || [];

    for (const sec of sections) {
      const secId = sec.id || sec._id;
      const subs = sec.subsections || sec.subSections || [];

      if (subs.length > 0) {
        for (const sub of subs) {
          const subId = sub.id || sub._id;
          const url = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secId}/tests?subSectionId=${subId}&limit=100`;
          try {
            const listRes = await getJson(url);
            const tests = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.tests || []);
            if (tests.length > 0) {
              results[s.slug].categories.push({
                sectionName: sec.name,
                subSectionName: sub.name,
                sectionId: secId,
                subSectionId: subId,
                tests: tests.map(t => ({
                  id: t.id || t._id,
                  title: t.title,
                  totalQuestions: t.questionCount || t.totalQuestions,
                  totalMarks: t.totalMark || t.totalMarks,
                  duration: t.duration || t.durationMinutes
                }))
              });
              console.log(`  [${sec.name} > ${sub.name}]: ${tests.length} tests`);
            }
          } catch (e) {
            console.error(`  Error in sub ${sub.name}:`, e.message);
          }
        }
      } else {
        const url = `https://api.repeatermock.com/api/v1/test-series/${seriesId}/sections/${secId}/tests?limit=100`;
        try {
          const listRes = await getJson(url);
          const tests = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.tests || []);
          if (tests.length > 0) {
            results[s.slug].categories.push({
              sectionName: sec.name,
              subSectionName: null,
              sectionId: secId,
              subSectionId: null,
              tests: tests.map(t => ({
                id: t.id || t._id,
                title: t.title,
                totalQuestions: t.questionCount || t.totalQuestions,
                totalMarks: t.totalMark || t.totalMarks,
                duration: t.duration || t.durationMinutes
              }))
            });
            console.log(`  [${sec.name}]: ${tests.length} tests`);
          }
        } catch (e) {
          console.error(`  Error in sec ${sec.name}:`, e.message);
        }
      }
    }
  }

  fs.writeFileSync('scripts/rrb_discovered_tests.json', JSON.stringify(results, null, 2));
  console.log('\nDiscovery complete! Saved to scripts/rrb_discovered_tests.json');
}

discoverRrbTests();
