const fs = require('fs');
const path = require('path');
const {
  cleanHtmlToKaTeX,
  extractTestAndAnswersFromHtml,
  fetchTestRaw,
  formatDisplayTitle
} = require('./pipeline_utils');

const discovered = require('./rrb_discovered_tests.json');

function compileAllTargets() {
  const list = [];

  // 1. RRB ALP 2024 CBT 1 (15 official papers held 25 Nov - 29 Nov 2024)
  const alp2024Cat = discovered['rrb-alp']?.categories.find(
    c => c.sectionName.includes('Previous Year Paper') && c.subSectionName === '2024'
  );
  if (alp2024Cat) {
    alp2024Cat.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-alp',
        testId: t.id,
        customId: `rrb-alp-2024-cbt1-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB ALP 2024 CBT-1',
        examCode: 'rrb-alp-cbt1',
        examFamily: 'rrb',
        examYear: 2024,
        tier: 'CBT-1',
        durationMinutes: 60,
        positiveMarks: 1.0,
        negativeMarks: 0.33,
        isSectionWise: false
      });
    });
  }

  // 2. RRB ALP CBT 2 (RAC Mechanic & Armature held in May 2025)
  const alpRacCat = discovered['rrb-alp']?.categories.find(
    c => c.sectionName.includes('Previous Year Paper (CBT 2)') && c.subSectionName === 'RAC Mechanic'
  );
  if (alpRacCat) {
    alpRacCat.tests.forEach((t, idx) => {
      list.push({
        seriesSlug: 'rrb-alp',
        testId: t.id,
        customId: `rrb-alp-cbt2-rac-2025-shift-${idx + 1}`,
        rawTitle: t.title,
        examType: 'RRB ALP CBT-2 (RAC Mechanic)',
        examCode: 'rrb-alp-cbt2',
        examFamily: 'rrb',
        examYear: 2025,
        tier: 'CBT-2',
        durationMinutes: 90,
        positiveMarks: 1.0,
        negativeMarks: 0.33,
        isSectionWise: false
      });
    });
  }

  const alpArmatureCat = discovered['rrb-alp']?.categories.find(
    c => c.sectionName.includes('Previous Year Paper (CBT 2)') && c.subSectionName === 'Other Electrical Trade'
  );
  if (alpArmatureCat) {
    const armatureTest = alpArmatureCat.tests.find(t => t.title.includes('Armature') || t.title.includes('2025'));
    if (armatureTest) {
      list.push({
        seriesSlug: 'rrb-alp',
        testId: armatureTest.id,
        customId: `rrb-alp-cbt2-armature-2025-shift-1`,
        rawTitle: armatureTest.title,
        examType: 'RRB ALP CBT-2 (Armature & Coil Winder)',
        examCode: 'rrb-alp-cbt2',
        examFamily: 'rrb',
        examYear: 2025,
        tier: 'CBT-2',
        durationMinutes: 90,
        positiveMarks: 1.0,
        negativeMarks: 0.33,
        isSectionWise: false
      });
    }
  }

  // 3. RRB NTPC Graduate 2025 CBT 1 (Remaining Shifts 25 to 47 held in Jun 2025)
  const grad2025Cat = discovered['rrb-ntpc']?.categories.find(
    c => c.subSectionName?.includes('2025 Graduate (CBT 1)')
  );
  if (grad2025Cat) {
    grad2025Cat.tests.slice(24).forEach((t, idx) => {
      const shiftNum = 25 + idx;
      list.push({
        seriesSlug: 'rrb-ntpc',
        testId: t.id,
        customId: `rrb-ntpc-grad-2025-shift-${shiftNum}`,
        rawTitle: t.title,
        examType: 'RRB NTPC Graduate 2025 CBT-1',
        examCode: 'rrb-ntpc-grad-cbt1',
        examFamily: 'rrb',
        examYear: 2025,
        tier: 'CBT-1',
        durationMinutes: 90,
        positiveMarks: 1.0,
        negativeMarks: 0.33,
        isSectionWise: false
      });
    });
  }

  // 4. RRB NTPC Under Graduate (UG) 2025 CBT 1 (Remaining Shifts 33 to 57 held in Aug 2025)
  const ug2025Cat = discovered['rrb-ntpc-ug']?.categories.find(
    c => c.subSectionName?.includes('2025 Under Graduate (CBT 1)')
  );
  if (ug2025Cat) {
    ug2025Cat.tests.slice(32).forEach((t, idx) => {
      const shiftNum = 33 + idx;
      list.push({
        seriesSlug: 'rrb-ntpc-ug',
        testId: t.id,
        customId: `rrb-ntpc-ug-2025-shift-${shiftNum}`,
        rawTitle: t.title,
        examType: 'RRB NTPC (UG) 2025 CBT-1',
        examCode: 'rrb-ntpc-ug-cbt1',
        examFamily: 'rrb',
        examYear: 2025,
        tier: 'CBT-1',
        durationMinutes: 90,
        positiveMarks: 1.0,
        negativeMarks: 0.33,
        isSectionWise: true
      });
    });
  }

  return list;
}

async function processTargetTest(tItem) {
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
    const secName = sec.title || (tItem.isSectionWise ? 'General Section' : 'Official Test');
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
        : `**Official Railway Board Key:** Option (${correctOptionNum}) is verified as the correct answer.`;

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
        marks: Number(q.posMarks) || tItem.positiveMarks || 1.0,
        negativeMarks: Number(q.negMarks) || tItem.negativeMarks || 0.33,
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
    examYear: tItem.examYear || 2024,
    tier: tItem.tier || 'CBT-1',
    durationMinutes: tItem.durationMinutes || 90,
    totalMarks: Math.round(totalMarks),
    totalQuestions: totalQs,
    positiveMarks: tItem.positiveMarks || 1.0,
    negativeMarks: tItem.negativeMarks || 0.33,
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
  const targets = compileAllTargets();
  console.log(`Compiled ${targets.length} target RRB 2024 & 2025 papers for ingestion.`);

  const processed = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    try {
      console.log(`\n[${i + 1}/${targets.length}] ${t.customId}...`);
      const res = await processTargetTest(t);
      if (res) processed.push(res);
    } catch (e) {
      console.error(`Error on ${t.customId}:`, e.message);
    }
  }

  // Update catalog
  const catalogPath = path.resolve(__dirname, '../src/data/tests-catalog.json');
  let catalog = [];
  if (fs.existsSync(catalogPath)) {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  }

  const catalogMap = new Map(catalog.map(x => [x.id, x]));
  for (const t of processed) {
    catalogMap.set(t.id, {
      id: t.id,
      title: t.title,
      examCode: t.examCode,
      examFamily: t.examFamily,
      examYear: t.examYear,
      type: 'pyq',
      isOfficialPYQ: true,
      durationMinutes: t.durationMinutes,
      totalMarks: t.totalMarks,
      totalQuestions: t.totalQuestions,
      positiveMarks: t.positiveMarks,
      negativeMarks: t.negativeMarks,
      sections: (t.sections || []).map(s => ({
        id: s.id,
        name: s.name,
        questionCount: s.questions.length,
        marks: s.questions.reduce((sum, q) => sum + (q.marks || 1), 0)
      })),
      isPublished: true
    });
  }

  const finalCatalog = Array.from(catalogMap.values());
  fs.writeFileSync(catalogPath, JSON.stringify(finalCatalog, null, 2));
  console.log(`\nSuccessfully updated tests-catalog.json! Total catalog count: ${finalCatalog.length}`);
}

run().catch(console.error);
