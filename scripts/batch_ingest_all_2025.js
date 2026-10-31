const fs = require('fs');
const path = require('path');
const {
  supabase,
  decodeHtmlEntities,
  cleanHtmlToKaTeX,
  extractTestAndAnswersFromHtml,
  fetchTestRaw,
  formatDisplayTitle
} = require('./pipeline_utils');

const discovered = require('./all_2025_discovered_shifts.json');

// Build target list of all official 2025 shifts
function compileShiftList() {
  const list = [];

  // 1. SSC CGL Tier 1 (2025) - 45 shifts
  const cglPyp = discovered['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier I)'));
  const cgl2025 = cglPyp?.subSections.find(sub => sub.name === '2025');
  if (cgl2025) {
    cgl2025.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'ssc-cgl',
        testId: t.id,
        customId: `ssc-cgl-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'SSC CGL 2025 Tier-1',
        examCode: 'ssc-cgl-tier1',
        examFamily: 'ssc',
        subCategory: 'CGL Tier 1'
      });
    });
  }

  // 2. SSC CGL Tier 2 (2025 cycle held Jan 2026)
  const cglTier2 = discovered['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier II)'));
  const cglTier2Sub = cglTier2?.subSections.find(sub => sub.name.includes('2025 - 2026'));
  if (cglTier2Sub) {
    cglTier2Sub.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'ssc-cgl',
        testId: t.id,
        customId: `ssc-cgl-2025-tier2-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'SSC CGL 2025 Tier-2',
        examCode: 'ssc-cgl-tier2',
        examFamily: 'ssc',
        subCategory: 'CGL Tier 2'
      });
    });
  }

  // 3. SSC CHSL Tier 1 (2025) - 50 shifts
  const chslPyp = discovered['ssc-chsl']?.sections.find(s => s.name.includes('PYP (Tier - I) (New Pattern)') || s.name.includes('PYP (Tier - I)'));
  const chsl2025 = chslPyp?.subSections.find(sub => sub.name === '2025');
  if (chsl2025) {
    chsl2025.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'ssc-chsl',
        testId: t.id,
        customId: `ssc-chsl-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'SSC CHSL 2025 Tier-1',
        examCode: 'ssc-chsl-tier1',
        examFamily: 'ssc',
        subCategory: 'CHSL Tier 1'
      });
    });
  }

  // 4. SSC MTS (2025 cycle) - 16 shifts
  const mtsPyp = discovered['ssc-mts']?.sections.find(s => s.name.includes('Previous Year Paper'));
  const mts2025 = mtsPyp?.subSections.find(sub => sub.name === '2025');
  if (mts2025) {
    mts2025.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'ssc-mts',
        testId: t.id,
        customId: `ssc-mts-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'SSC MTS 2025',
        examCode: 'ssc-mts',
        examFamily: 'ssc',
        subCategory: 'MTS'
      });
    });
  }

  // 5. RRB NTPC Graduate 2025 (held in 2026) - 24 shifts
  const rrbPyp = discovered['rrb-ntpc']?.sections.find(s => s.name.includes('PYP (CBT 1)'));
  const ntpcGrad2026 = rrbPyp?.subSections.find(sub => sub.name.includes('2026 Graduate'));
  if (ntpcGrad2026) {
    ntpcGrad2026.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-ntpc',
        testId: t.id,
        customId: `rrb-ntpc-grad-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB NTPC Graduate 2025 CBT-1',
        examCode: 'rrb-ntpc-cbt1',
        examFamily: 'rrb',
        subCategory: 'NTPC Graduate'
      });
    });
  }

  // 6. RRB NTPC Under-Graduate 2025 (held in 2026) - 32 shifts
  const ntpcUg2026 = rrbPyp?.subSections.find(sub => sub.name.includes('2026 Under Graduate'));
  if (ntpcUg2026) {
    ntpcUg2026.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-ntpc',
        testId: t.id,
        customId: `rrb-ntpc-ug-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB NTPC (UG) 2025 CBT-1',
        examCode: 'rrb-ntpc-cbt1',
        examFamily: 'rrb',
        subCategory: 'NTPC UG'
      });
    });
  }

  // 7. RRB ALP 2025 - 11 shifts
  const alpPyp = discovered['rrb-alp']?.sections.find(s => s.name.includes('Previous Year Paper'));
  const alp2025 = alpPyp?.subSections.find(sub => sub.name === '2025');
  if (alp2025) {
    alp2025.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-alp',
        testId: t.id,
        customId: `rrb-alp-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB ALP 2025 CBT-1',
        examCode: 'rrb-alp-cbt1',
        examFamily: 'rrb',
        subCategory: 'ALP CBT 1'
      });
    });
  }

  return list;
}

// Load existing bundle if present
const bundlePath = path.resolve(__dirname, '../src/data/mock-tests-bundle.json');
let existingBundle = [];
if (fs.existsSync(bundlePath)) {
  try {
    existingBundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  } catch (e) {}
}

const existingMap = new Map(existingBundle.map(t => [t.id, t]));

async function processShift(shift) {
  const displayTitle = formatDisplayTitle(shift.rawTitle, shift.examType);
  const html = await fetchTestRaw(shift.seriesSlug, shift.testId);
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

      const explanationEn = rawSolEn
        ? cleanHtmlToKaTeX(resolveValue(rawSolEn))
        : `Official Answer Key: Option (${correctOptionNum})`;

      const explanationHi = rawSolHn
        ? cleanHtmlToKaTeX(resolveValue(rawSolHn))
        : undefined;

      const qItem = {
        id: `${shift.customId}_q${globalQno}`,
        qno: globalQno,
        questionText: cleanHtmlToKaTeX(resolveValue(q.en?.value || 'Question text not available')),
        questionTextHi: q.hn?.value ? cleanHtmlToKaTeX(resolveValue(q.hn.value)) : undefined,
        options,
        correctOption: correctOptionNum,
        explanation: explanationEn,
        explanationHi,
        marks: q.posMarks || (shift.examCode === 'ssc-cgl-tier2' ? 3.0 : 2.0),
        negativeMarks: q.negMarks || (shift.examCode === 'ssc-cgl-tier2' ? 1.0 : 0.5),
        sectionName: sec.title
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

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const totalMarks = sections.reduce((sum, s) => sum + s.questions.reduce((m, q) => m + q.marks, 0), 0);
  const durationMinutes = testData.duration || (shift.examCode === 'ssc-cgl-tier2' ? 135 : 60);

  return {
    id: shift.customId,
    title: displayTitle,
    category: shift.examFamily,
    subCategory: shift.subCategory,
    examCode: shift.examCode,
    type: 'pyq',
    isOfficialPYQ: true,
    examYear: 2025,
    durationMinutes,
    totalQuestions,
    totalMarks,
    positiveMarks: shift.examCode === 'ssc-cgl-tier2' ? 3.0 : 2.0,
    negativeMarks: shift.examCode === 'ssc-cgl-tier2' ? 1.0 : 0.5,
    sections
  };
}

async function runPipeline() {
  const shifts = compileShiftList();
  console.log(`====================================================`);
  console.log(`TOTAL 2025 OFFICIAL SHIFTS TO PROCESS: ${shifts.length}`);
  console.log(`====================================================\n`);

  let count = 0;
  let successCount = 0;

  for (const shift of shifts) {
    count++;
    console.log(`[${count}/${shifts.length}] Processing ${shift.examType}: ${shift.rawTitle} (${shift.customId})...`);

    try {
      const processedTest = await processShift(shift);
      existingMap.set(processedTest.id, processedTest);
      successCount++;

      // Upsert to Supabase
      try {
        await supabase.from('tests').upsert({
          id: processedTest.id,
          title: processedTest.title,
          category: processedTest.category,
          sub_category: processedTest.subCategory,
          type: processedTest.type,
          duration_minutes: processedTest.durationMinutes,
          total_questions: processedTest.totalQuestions,
          total_marks: processedTest.totalMarks,
          positive_marks: processedTest.positiveMarks,
          negative_marks: processedTest.negativeMarks,
          sections: processedTest.sections
        });
      } catch (dbErr) {
        console.warn(`Supabase upsert warning for ${processedTest.id}:`, dbErr.message);
      }

      // Checkpoint every 5 tests to disk
      if (count % 5 === 0 || count === shifts.length) {
        const fullBundle = Array.from(existingMap.values());
        fs.writeFileSync(bundlePath, JSON.stringify(fullBundle, null, 2));
        console.log(`>> Checkpoint saved: ${fullBundle.length} tests in bundle <<`);
      }
    } catch (err) {
      console.error(`Error processing ${shift.customId}:`, err.message);
    }
  }

  const finalBundle = Array.from(existingMap.values());
  fs.writeFileSync(bundlePath, JSON.stringify(finalBundle, null, 2));
  console.log(`\n====================================================`);
  console.log(`ALL DONE! Successfully processed ${successCount}/${shifts.length} shifts.`);
  console.log(`Bundle now contains ${finalBundle.length} total tests.`);
  console.log(`====================================================\n`);
}

runPipeline().catch(console.error);
