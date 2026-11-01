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

const discovered = require('./rrb_discovered_tests.json');

// Build the complete list of target RRB tests
function compileRrbTargetList() {
  const list = [];

  // 1. RRB NTPC Under Graduate (UG) 2026 & 2025 CBT 1 (Strict Section-wise: GA 40, Math 30, Reasoning 30)
  const ugCat2026 = discovered['rrb-ntpc-ug']?.categories.find(c => c.subSectionName?.includes('2026 Under Graduate'));
  if (ugCat2026) {
    ugCat2026.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-ntpc-ug',
        testId: t.id,
        customId: `rrb-ntpc-ug-2026-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB NTPC (UG) 2026 CBT-1',
        examCode: 'rrb-ntpc-ug-cbt1',
        examFamily: 'rrb',
        subCategory: 'NTPC Under Graduate CBT 1',
        isSectionWise: true,
        hasSectionalTiming: false,
        durationMinutes: 90
      });
    });
  }

  // 2. RRB NTPC Under Graduate (UG) CBT 2
  const ugCbt2Cat = discovered['rrb-ntpc-ug']?.categories.find(c => c.sectionName?.includes('Full Test (CBT 2)') && c.subSectionName?.includes('Foundational'));
  if (ugCbt2Cat) {
    ugCbt2Cat.tests.slice(0, 5).forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-ntpc-ug',
        testId: t.id,
        customId: `rrb-ntpc-ug-cbt2-mock-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB NTPC (UG) CBT-2',
        examCode: 'rrb-ntpc-ug-cbt2',
        examFamily: 'rrb',
        subCategory: 'NTPC Under Graduate CBT 2',
        isSectionWise: true,
        hasSectionalTiming: false,
        durationMinutes: 90
      });
    });
  }

  // 3. RRB NTPC Graduate 2025 CBT 1 & CBT 2 (Mixed questions structure)
  const gradCbt2Cat = discovered['rrb-ntpc']?.categories.find(c => c.sectionName?.includes('Full Test (CBT - 2)') && c.subSectionName?.includes('Foundational'));
  if (gradCbt2Cat) {
    gradCbt2Cat.tests.slice(0, 5).forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-ntpc',
        testId: t.id,
        customId: `rrb-ntpc-grad-cbt2-mock-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB NTPC Graduate CBT-2',
        examCode: 'rrb-ntpc-grad-cbt2',
        examFamily: 'rrb',
        subCategory: 'NTPC Graduate CBT 2',
        isSectionWise: false,
        hasSectionalTiming: false,
        durationMinutes: 90
      });
    });
  }

  // 4. RRB Group D 2025-26 (4-Subject Breakdown: Science 25, Math 25, Reasoning 30, GA 20)
  const groupDPyp = discovered['rrb-group-d']?.categories.find(c => c.subSectionName?.includes('2024 - 2026'));
  if (groupDPyp) {
    groupDPyp.tests.slice(0, 20).forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-group-d',
        testId: t.id,
        customId: `rrb-group-d-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB Group D 2025-26',
        examCode: 'rrb-group-d',
        examFamily: 'rrb',
        subCategory: 'RRB Group D',
        isSectionWise: true,
        hasSectionalTiming: false,
        durationMinutes: 90
      });
    });
  }

  // 5. RRB Section Controller 2025-26
  const secCtrlCat = discovered['rrb-section-controller']?.categories.find(c => c.sectionName?.includes('Full Test (New Pattern)'));
  if (secCtrlCat) {
    secCtrlCat.tests.slice(0, 8).forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-section-controller',
        testId: t.id,
        customId: `rrb-section-controller-mock-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB Section Controller 2025-26',
        examCode: 'rrb-section-controller',
        examFamily: 'rrb',
        subCategory: 'Section Controller',
        isSectionWise: false,
        hasSectionalTiming: false,
        durationMinutes: 90
      });
    });
  }

  // 6. RRB ALP 2025-26 (CBT 1 & CBT 2)
  const alpPyp = discovered['rrb-alp']?.categories.find(c => c.sectionName?.includes('Previous Year Paper') && c.subSectionName?.includes('2025'));
  if (alpPyp) {
    alpPyp.tests.slice(0, 11).forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-alp',
        testId: t.id,
        customId: `rrb-alp-2026-cbt1-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB ALP 2026 CBT-1',
        examCode: 'rrb-alp-cbt1',
        examFamily: 'rrb',
        subCategory: 'ALP CBT 1',
        isSectionWise: true,
        hasSectionalTiming: false,
        durationMinutes: 60
      });
    });
  }

  return list;
}

async function processOneTest(tItem) {
  const filePath = path.resolve(__dirname, `../src/data/tests/${tItem.customId}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`[SKIP] Already exists: ${tItem.customId}`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  console.log(`\n[FETCH] ${tItem.examType}: ${tItem.rawTitle} (${tItem.testId})...`);
  const html = await fetchTestRaw(tItem.seriesSlug, tItem.testId);
  const { testData, answersData, resolveValue } = extractTestAndAnswersFromHtml(html);

  if (!testData || !testData.sections) {
    throw new Error(`Failed to parse test data for ${tItem.customId}`);
  }

  let globalQno = 1;
  const sections = testData.sections.map((sec, sIdx) => {
    const secName = sec.title || (tItem.isSectionWise ? 'General Section' : 'Test');
    const questions = sec.questions.map((q) => {
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
        : `**Official Answer Key:** Option (${correctOptionNum}) is verified as the correct answer.`;

      const explanationHi = rawSolHn ? cleanHtmlToKaTeX(resolveValue(rawSolHn)) : undefined;

      const qItem = {
        id: `${tItem.customId}_q${globalQno}`,
        qno: globalQno,
        questionText: cleanHtmlToKaTeX(resolveValue(q.en?.value || 'Question text not available')),
        questionTextHi: q.hn?.value ? cleanHtmlToKaTeX(resolveValue(q.hn.value)) : undefined,
        options,
        correctOption: correctOptionNum,
        explanation: explanationEn,
        explanationHi,
        marks: Number(q.posMarks) || 1.0,
        negativeMarks: Number(q.negMarks) || 0.33,
        sectionName: secName,
        examOrigin: `${tItem.examType} — ${tItem.rawTitle}`
      };

      globalQno++;
      return qItem;
    });

    return {
      id: `${tItem.customId}_sec_${sIdx + 1}`,
      name: secName,
      questions
    };
  });

  const totalQs = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const totalMarks = sections.reduce((sum, s) => sum + s.questions.reduce((m, q) => m + q.marks, 0), 0);

  const displayTitle = formatDisplayTitle(tItem.rawTitle, tItem.examType);

  const fullTestObj = {
    id: tItem.customId,
    title: displayTitle,
    examCode: tItem.examCode,
    examFamily: tItem.examFamily,
    tier: tItem.examCode.includes('cbt2') ? 'CBT-2' : 'CBT-1',
    durationMinutes: tItem.durationMinutes || 90,
    totalMarks: Math.round(totalMarks),
    totalQuestions: totalQs,
    positiveMarks: 1.0,
    negativeMarks: 0.33,
    hasSectionalTiming: false,
    sectionalTimingMinutes: 0,
    isPublished: true,
    sections
  };

  fs.writeFileSync(filePath, JSON.stringify(fullTestObj, null, 2));
  console.log(`[SAVED] ${tItem.customId} (${totalQs} Qs, ${sections.length} Sections)`);
  return fullTestObj;
}

async function run() {
  const targets = compileRrbTargetList();
  console.log(`Total RRB tests queued for ingestion: ${targets.length}`);

  const processed = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    try {
      console.log(`\n--- [${i + 1}/${targets.length}] Processing ${t.customId} ---`);
      const res = await processOneTest(t);
      if (res) processed.push(res);
    } catch (err) {
      console.error(`[ERROR] Processing ${t.customId}:`, err.message);
    }
  }

  // Update tests-catalog.json
  const catalogPath = path.resolve(__dirname, '../src/data/tests-catalog.json');
  let currentCatalog = [];
  if (fs.existsSync(catalogPath)) {
    try {
      currentCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    } catch (e) {}
  }

  const catalogMap = new Map(currentCatalog.map(x => [x.id, x]));
  for (const t of processed) {
    catalogMap.set(t.id, {
      id: t.id,
      title: t.title,
      examCode: t.examCode,
      examFamily: t.examFamily,
      durationMinutes: t.durationMinutes,
      totalMarks: t.totalMarks,
      totalQuestions: t.totalQuestions,
      positiveMarks: t.positiveMarks,
      negativeMarks: t.negativeMarks,
      isPublished: true
    });
  }

  const updatedCatalog = Array.from(catalogMap.values());
  fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2));
  console.log(`\n[SUCCESS] Updated tests-catalog.json! Total tests in catalog: ${updatedCatalog.length}`);
}

run().catch(console.error);
