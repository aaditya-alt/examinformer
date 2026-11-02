const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const {
  fetchTestRaw,
  extractTestAndAnswersFromHtml,
  decodeHtmlEntities
} = require('./pipeline_utils');

const discoveredSsc = require('./all_2025_discovered_shifts.json');
const discoveredRrb = fs.existsSync(path.resolve(__dirname, './rrb_discovered_tests.json'))
  ? require('./rrb_discovered_tests.json')
  : {};

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

function extractImagesFromHtml(html) {
  if (!html) return [];
  const decoded = decodeHtmlEntities(html);
  const urls = [];
  const regex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(decoded)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

function cleanHtmlPreservingImages(html) {
  if (!html) return '';
  let text = decodeHtmlEntities(html);
  text = text.replace(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi, '\n\n![Diagram]($1)\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');
  text = text.replace(/<span[^>]*>/gi, '');
  text = text.replace(/<\/span>/gi, '');
  text = text.replace(/<strong>/gi, '**');
  text = text.replace(/<\/strong>/gi, '**');
  text = text.replace(/<b>/gi, '**');
  text = text.replace(/<\/b>/gi, '**');
  text = text.replace(/<em>/gi, '*');
  text = text.replace(/<\/em>/gi, '*');
  text = text.replace(/<i>/gi, '*');
  text = text.replace(/<\/i>/gi, '*');
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (m) => m.replace(/<[^>]+>/g, ' '));
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

function cleanTextOnly(html) {
  if (!html) return '';
  let text = decodeHtmlEntities(html);
  text = text.replace(/<img[^>]*>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');
  text = text.replace(/<span[^>]*>/gi, '');
  text = text.replace(/<\/span>/gi, '');
  text = text.replace(/<strong>/gi, '**');
  text = text.replace(/<\/strong>/gi, '**');
  text = text.replace(/<b>/gi, '**');
  text = text.replace(/<\/b>/gi, '**');
  text = text.replace(/<em>/gi, '*');
  text = text.replace(/<\/em>/gi, '*');
  text = text.replace(/<i>/gi, '*');
  text = text.replace(/<\/i>/gi, '*');
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (m) => m.replace(/<[^>]+>/g, ' '));
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

// Build map of customId -> { seriesSlug, testId, rawTitle }
function buildTestCatalog() {
  const map = new Map();

  // SSC CGL Tier 1 2025
  const cglPyp = discoveredSsc['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier I)'));
  const cgl2025 = cglPyp?.subSections.find(sub => sub.name === '2025');
  if (cgl2025) {
    cgl2025.tests.forEach((t, idx) => {
      map.set(`ssc-cgl-2025-shift-${idx + 1}`, { seriesSlug: 'ssc-cgl', testId: t.id, title: t.title });
    });
  }

  // SSC CGL Tier 2 2025-2026
  const cglTier2 = discoveredSsc['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier II)'));
  const cglTier2Sub = cglTier2?.subSections.find(sub => sub.name.includes('2025 - 2026'));
  if (cglTier2Sub) {
    cglTier2Sub.tests.forEach((t, idx) => {
      map.set(`ssc-cgl-2025-tier2-shift-${idx + 1}`, { seriesSlug: 'ssc-cgl', testId: t.id, title: t.title });
    });
  }

  // SSC CHSL Tier 1 2025
  const chslPyp = discoveredSsc['ssc-chsl']?.sections.find(s => s.name === 'PYP (Tier - I)');
  const chsl2025 = chslPyp?.subSections.find(sub => sub.name === '2025');
  if (chsl2025) {
    chsl2025.tests.forEach((t, idx) => {
      map.set(`ssc-chsl-2025-shift-${idx + 1}`, { seriesSlug: 'ssc-chsl', testId: t.id, title: t.title });
    });
  }

  // SSC MTS 2025
  const mtsPyp = discoveredSsc['ssc-mts']?.sections.find(s => s.name.includes('Previous Year Paper'));
  const mts2025 = mtsPyp?.subSections.find(sub => sub.name === '2025');
  if (mts2025) {
    mts2025.tests.forEach((t, idx) => {
      map.set(`ssc-mts-2025-shift-${idx + 1}`, { seriesSlug: 'ssc-mts', testId: t.id, title: t.title });
    });
  }

  // RRB NTPC Graduate 2026 (held Jan-Feb 2026) -> shifts 1-24
  const rrbGradPyp = discoveredSsc['rrb-ntpc']?.sections.find(s => s.name.includes('PYP (CBT 1)'));
  const ntpcGrad2026 = rrbGradPyp?.subSections.find(sub => sub.name.includes('2026 Graduate'));
  if (ntpcGrad2026) {
    ntpcGrad2026.tests.forEach((t, idx) => {
      map.set(`rrb-ntpc-grad-2025-shift-${idx + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
      map.set(`rrb-ntpc-grad-2026-shift-${idx + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
    });
  }

  // RRB NTPC Graduate 2025 (shifts 25-47)
  const grad2025Cat = discoveredRrb['rrb-ntpc']?.categories.find(c => c.subSectionName?.includes('2025 Graduate (CBT 1)'));
  if (grad2025Cat) {
    grad2025Cat.tests.slice(24).forEach((t, idx) => {
      const shiftNum = 25 + idx;
      map.set(`rrb-ntpc-grad-2025-shift-${shiftNum}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
    });
  }

  // RRB NTPC UG 2026 (shifts 1-32)
  const ntpcUg2026 = rrbGradPyp?.subSections.find(sub => sub.name.includes('2026 Under Graduate'));
  if (ntpcUg2026) {
    ntpcUg2026.tests.forEach((t, idx) => {
      map.set(`rrb-ntpc-ug-2025-shift-${idx + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
      map.set(`rrb-ntpc-ug-2026-shift-${idx + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
    });
  }

  // RRB NTPC UG 2025 (shifts 33-57)
  const ug2025Cat = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName?.includes('2025 Under Graduate (CBT 1)'));
  if (ug2025Cat) {
    ug2025Cat.tests.slice(32).forEach((t, idx) => {
      const shiftNum = 33 + idx;
      map.set(`rrb-ntpc-ug-2025-shift-${shiftNum}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
    });
  }

  // RRB ALP 2025 (11 shifts)
  const alpPyp = discoveredSsc['rrb-alp']?.sections.find(s => s.name.includes('Previous Year Paper'));
  const alp2025 = alpPyp?.subSections.find(sub => sub.name === '2025');
  if (alp2025) {
    alp2025.tests.forEach((t, idx) => {
      map.set(`rrb-alp-2025-shift-${idx + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
    });
  }

  // RRB ALP 2024 (15 shifts)
  const alp2024Cat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper') && c.subSectionName === '2024');
  if (alp2024Cat) {
    alp2024Cat.tests.forEach((t, idx) => {
      map.set(`rrb-alp-2024-cbt1-shift-${idx + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
    });
  }

  // RRB ALP CBT 2 RAC (2 shifts)
  const alpRacCat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper (CBT 2)') && c.subSectionName === 'RAC Mechanic');
  if (alpRacCat) {
    alpRacCat.tests.forEach((t, idx) => {
      map.set(`rrb-alp-cbt2-rac-2025-shift-${idx + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
    });
  }

  // RRB Group D
  const groupDPyp = discoveredRrb['rrb-group-d']?.categories.find(c => c.subSectionName?.includes('2024 - 2026'));
  if (groupDPyp) {
    groupDPyp.tests.slice(0, 20).forEach((t, idx) => {
      map.set(`rrb-group-d-2025-shift-${idx + 1}`, { seriesSlug: 'rrb-group-d', testId: t.id, title: t.title });
    });
  }

  return map;
}

async function restoreTestImages(customId, meta) {
  console.log(`[RESTORING] ${customId} (${meta.seriesSlug} / ${meta.testId})...`);
  const html = await fetchTestRaw(meta.seriesSlug, meta.testId);
  const { testData, answersData, resolveValue } = extractTestAndAnswersFromHtml(html);

  if (!testData || !testData.sections) {
    console.error(`  Failed to parse testData for ${customId}`);
    return 0;
  }

  let globalQno = 0;
  const updates = [];

  for (const sec of testData.sections) {
    for (const q of sec.questions) {
      globalQno++;
      const ans = answersData[q._id];
      const rawQEn = resolveValue(q.en?.value) || '';
      const rawQHn = resolveValue(q.hn?.value) || '';

      const qImgsEn = extractImagesFromHtml(rawQEn);
      const qImgsHn = extractImagesFromHtml(rawQHn);
      const questionImages = Array.from(new Set([...qImgsEn, ...qImgsHn]));

      const options = (q.en?.options || []).map((opt, oIdx) => {
        const rawOptEn = resolveValue(opt.value) || '';
        const rawOptHn = resolveValue(q.hn?.options?.[oIdx]?.value) || '';
        const optImgs = extractImagesFromHtml(rawOptEn).concat(extractImagesFromHtml(rawOptHn));
        const optImg = optImgs.length > 0 ? optImgs[0] : undefined;

        const textEn = cleanTextOnly(rawOptEn);
        const textHn = cleanTextOnly(rawOptHn);

        return {
          id: oIdx + 1,
          text_en: textEn,
          text_hi: textHn || textEn,
          imageUrl: optImg
        };
      });

      const rawSolEn = ans?.sol?.en?.value;
      const rawSolHn = ans?.sol?.hn?.value;
      const explanationEn = rawSolEn ? cleanHtmlPreservingImages(resolveValue(rawSolEn)) : undefined;
      const explanationHi = rawSolHn ? cleanHtmlPreservingImages(resolveValue(rawSolHn)) : undefined;

      const hasImages = questionImages.length > 0 || options.some(o => o.imageUrl) || (explanationEn && explanationEn.includes('![Diagram]'));

      if (hasImages) {
        updates.push({
          test_id: customId,
          question_number: globalQno,
          question_images: questionImages,
          options,
          explanation_en: explanationEn,
          explanation_hi: explanationHi
        });
      }
    }
  }

  if (updates.length === 0) {
    console.log(`  No images found in ${customId}.`);
    return 0;
  }

  console.log(`  Updating ${updates.length} questions in Supabase for ${customId}...`);

  const chunkSize = 10;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (u) => {
      const patchPayload = {
        question_images: u.question_images,
        options: u.options
      };
      if (u.explanation_en) patchPayload.explanation_en = u.explanation_en;
      if (u.explanation_hi) patchPayload.explanation_hi = u.explanation_hi;

      const { error: errUpd } = await supabase
        .from('questions')
        .update(patchPayload)
        .eq('test_id', u.test_id)
        .eq('question_number', u.question_number);

      if (errUpd) {
        console.error(`    Error updating Q.${u.question_number} in ${customId}:`, errUpd.message);
      }
    }));
  }

  // Resolve pending question reports for this test
  const { error: errRep } = await supabase
    .from('question_reports')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('test_id', customId)
    .eq('status', 'pending');

  if (errRep) {
    console.warn(`    Warning: failed to update question_reports for ${customId}:`, errRep.message);
  }

  console.log(`  Successfully restored ${updates.length} questions in ${customId}!`);
  return updates.length;
}

async function main() {
  console.log('=== STARTING REPEATERMOCK IMAGE RESTORATION ===');
  const catalog = buildTestCatalog();
  console.log(`Catalog ready with ${catalog.size} mapped shifts.`);

  // 1. Get tests with pending reports first
  const { data: pendingReports } = await supabase
    .from('question_reports')
    .select('test_id')
    .eq('status', 'pending');

  const pendingTestIds = Array.from(new Set((pendingReports || []).map(r => {
    // Some reports have test_id like "sec-ssc-cgl-2025-shift-45-sec-0"
    // Normalize back to base test_id
    let tid = r.test_id;
    if (tid.startsWith('sec-')) {
      tid = tid.replace(/^sec-/, '').replace(/-sec-\d+$/, '').replace(/-combined-\d+$/, '');
    }
    return tid;
  })));

  console.log(`Found ${pendingTestIds.length} unique tests with pending reports:`, pendingTestIds);

  let totalRestored = 0;
  let testCount = 0;

  for (const tid of pendingTestIds) {
    testCount++;
    const meta = catalog.get(tid);
    if (!meta) {
      console.warn(`[${testCount}/${pendingTestIds.length}] Could not find catalog mapping for ${tid}`);
      continue;
    }

    try {
      const restored = await restoreTestImages(tid, meta);
      totalRestored += restored;
    } catch (err) {
      console.error(`Error restoring ${tid}:`, err.message);
    }
  }

  console.log(`\n==============================================`);
  console.log(`RESTORATION COMPLETED!`);
  console.log(`Total questions with images restored: ${totalRestored}`);
  console.log(`==============================================\n`);
}

main().catch(console.error);
