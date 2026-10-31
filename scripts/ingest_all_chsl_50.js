const fs = require('fs');
const path = require('path');
const {
  supabase,
  cleanHtmlToKaTeX,
  extractTestAndAnswersFromHtml,
  fetchTestRaw,
  formatDisplayTitle
} = require('./pipeline_utils');

const discovered = require('./all_2025_discovered_shifts.json');

async function ingestChsl50() {
  const pypSec = discovered['ssc-chsl']?.sections.find(s => s.name === 'PYP (Tier - I)');
  const sub2025 = pypSec?.subSections.find(s => s.name === '2025');

  if (!sub2025 || !sub2025.tests) {
    throw new Error('CHSL 2025 section not found in discovered shifts');
  }

  const tests = sub2025.tests;
  console.log(`Starting ingestion for ${tests.length} SSC CHSL 2025 shift papers...`);

  const testsDir = path.resolve(__dirname, '../src/data/tests');
  const catalogPath = path.resolve(__dirname, '../src/data/tests-catalog.json');
  let catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  let successCount = 0;

  for (let idx = 0; idx < tests.length; idx++) {
    const t = tests[idx];
    const customId = `ssc-chsl-2025-shift-${idx + 1}`;
    console.log(`[${idx + 1}/${tests.length}] Fetching ${t.title} (${t.id})...`);

    try {
      const html = await fetchTestRaw('ssc-chsl', t.id);
      const { testData, answersData, resolveValue } = extractTestAndAnswersFromHtml(html);

      let globalQno = 1;
      const sections = testData.sections.map((sec, sIdx) => {
        const questions = sec.questions.map(q => {
          const ans = answersData[q._id];
          const correctOptionNum = parseInt(ans?.correctOption || '1', 10);

          const options = (q.en?.options || []).map((opt, oIdx) => ({
            id: oIdx + 1,
            text: cleanHtmlToKaTeX(resolveValue(opt.value)),
            textHi: q.hn?.options?.[oIdx]?.value ? cleanHtmlToKaTeX(resolveValue(q.hn.options[oIdx].value)) : undefined
          }));

          const rawSolEn = ans?.sol?.en?.value;
          const rawSolHn = ans?.sol?.hn?.value;

          let explanationEn = rawSolEn
            ? cleanHtmlToKaTeX(resolveValue(rawSolEn))
            : `Official Answer Key: Option (${correctOptionNum})`;

          if (explanationEn.trim().match(/^\$[0-9a-fA-F]{1,6}$/)) {
            explanationEn = `Official Answer Key: Option (${correctOptionNum})`;
          }

          const explanationHi = rawSolHn
            ? cleanHtmlToKaTeX(resolveValue(rawSolHn))
            : undefined;

          const qItem = {
            id: `${customId}_q${globalQno}`,
            qno: globalQno,
            questionText: cleanHtmlToKaTeX(resolveValue(q.en?.value || 'Question text not available')),
            questionTextHi: q.hn?.value ? cleanHtmlToKaTeX(resolveValue(q.hn.value)) : undefined,
            options,
            correctOption: correctOptionNum,
            explanation: explanationEn,
            explanationHi,
            marks: q.posMarks || 2.0,
            negativeMarks: q.negMarks || 0.5,
            sectionName: sec.title,
            examOrigin: `SSC CHSL 2025 Tier-1 (${t.title.split('(')[1]?.replace(')', '') || 'Shift ' + (idx + 1)})`
          };

          globalQno++;
          return qItem;
        });

        return {
          id: `sec_${sIdx + 1}`,
          name: sec.title,
          questions
        };
      });

      const displayTitle = formatDisplayTitle(t.title, 'SSC CHSL 2025 Tier-1');
      const testObj = {
        id: customId,
        title: displayTitle,
        category: 'ssc',
        subCategory: 'CHSL Tier 1',
        examCode: 'ssc-chsl-tier1',
        type: 'pyq',
        isOfficialPYQ: true,
        examYear: 2025,
        durationMinutes: testData.duration || 60,
        totalQuestions: sections.reduce((sum, s) => sum + s.questions.length, 0),
        totalMarks: sections.reduce((sum, s) => sum + s.questions.reduce((m, q) => m + q.marks, 0), 0),
        positiveMarks: 2.0,
        negativeMarks: 0.5,
        sections
      };

      // Save individual test file
      fs.writeFileSync(path.join(testsDir, `${customId}.json`), JSON.stringify(testObj));

      // Update catalog entry
      catalog = catalog.filter(c => c.id !== customId);
      catalog.push({
        id: testObj.id,
        title: testObj.title,
        examCode: testObj.examCode,
        examFamily: 'ssc',
        type: 'pyq',
        isOfficialPYQ: true,
        examYear: 2025,
        durationMinutes: testObj.durationMinutes,
        totalQuestions: testObj.totalQuestions,
        totalMarks: testObj.totalMarks,
        positiveMarks: testObj.positiveMarks,
        negativeMarks: testObj.negativeMarks,
        sections: testObj.sections.map(s => ({
          id: s.id,
          name: s.name,
          questionCount: s.questions.length,
          marks: s.questions.reduce((sum, q) => sum + q.marks, 0)
        }))
      });

      // Save catalog checkpoint
      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

      // Sync test meta to Supabase
      try {
        await supabase.from('tests').upsert({
          id: testObj.id,
          title: testObj.title,
          exam_code: testObj.examCode,
          type: 'pyq',
          total_questions: testObj.totalQuestions,
          total_marks: testObj.totalMarks,
          duration_minutes: testObj.durationMinutes,
          is_published: true
        });
      } catch (dbErr) {
        console.warn(`Supabase upsert warning for ${customId}:`, dbErr.message);
      }

      successCount++;
    } catch (err) {
      console.error(`Error on CHSL ${customId}:`, err.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`CHSL INGESTION COMPLETE! ${successCount}/${tests.length} shifts added.`);
  console.log(`Total tests in catalog now: ${catalog.length}`);
  console.log(`======================================================\n`);
}

ingestChsl50().catch(console.error);
