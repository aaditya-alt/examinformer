const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const {
  fetchTestRaw,
  extractTestAndAnswersFromHtml,
  decodeHtmlEntities
} = require('./pipeline_utils');

const discoveredSsc = require('./all_2025_discovered_shifts.json');
const discoveredRrb = require('./rrb_discovered_tests.json');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_DIR = path.resolve(__dirname, './cache_repeatermock');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

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
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (m) => m.replace(/<[^>]+>/g, ' '));
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

function buildFullTestCatalog() {
  const map = new Map();

  // 1. SSC CGL Tier 1 (45 shifts)
  const cglPyp = discoveredSsc['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier I)'));
  cglPyp?.subSections.find(s => s.name === '2025')?.tests.forEach((t, i) => {
    map.set(`ssc-cgl-2025-shift-${i + 1}`, { seriesSlug: 'ssc-cgl', testId: t.id, title: t.title });
  });

  // 2. SSC CGL Tier 2 (1 shift)
  const cglTier2 = discoveredSsc['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier II)'));
  cglTier2?.subSections.find(s => s.name.includes('2025 - 2026'))?.tests.forEach((t, i) => {
    map.set(`ssc-cgl-2025-tier2-shift-${i + 1}`, { seriesSlug: 'ssc-cgl', testId: t.id, title: t.title });
  });

  // 3. SSC CHSL Tier 1 (50 shifts)
  const chslPyp = discoveredSsc['ssc-chsl']?.sections.find(s => s.name === 'PYP (Tier - I)');
  chslPyp?.subSections.find(s => s.name === '2025')?.tests.forEach((t, i) => {
    map.set(`ssc-chsl-2025-shift-${i + 1}`, { seriesSlug: 'ssc-chsl', testId: t.id, title: t.title });
  });

  // 4. SSC CHSL Tier 2 (1 shift)
  const chslTier2 = discoveredSsc['ssc-chsl']?.sections.find(s => s.name.includes('Tier - II') || s.name.includes('Tier 2') || s.name.includes('New Pattern'));
  const chslTier2Test = chslTier2?.subSections?.[0]?.tests?.[0];
  if (chslTier2Test) {
    map.set(`ssc-chsl-2025-tier2-shift-1`, { seriesSlug: 'ssc-chsl', testId: chslTier2Test.id, title: chslTier2Test.title });
  }

  // 5. SSC MTS (16 shifts)
  const mtsPyp = discoveredSsc['ssc-mts']?.sections.find(s => s.name.includes('Previous Year Paper'));
  mtsPyp?.subSections.find(s => s.name === '2025')?.tests.forEach((t, i) => {
    map.set(`ssc-mts-2025-shift-${i + 1}`, { seriesSlug: 'ssc-mts', testId: t.id, title: t.title });
  });

  // 6. RRB ALP 2025 (11 shifts)
  const alp2025Cat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper') && c.subSectionName === '2025');
  alp2025Cat?.tests.forEach((t, i) => {
    map.set(`rrb-alp-2025-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
    map.set(`rrb-alp-2026-cbt1-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
  });

  // 7. RRB ALP 2024 (15 shifts)
  const alp2024Cat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper') && c.subSectionName === '2024');
  alp2024Cat?.tests.forEach((t, i) => {
    map.set(`rrb-alp-2024-cbt1-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
  });

  // 8. RRB ALP CBT 2 (RAC & Armature)
  const alpRacCat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper (CBT 2)') && c.subSectionName === 'RAC Mechanic');
  alpRacCat?.tests.forEach((t, i) => {
    map.set(`rrb-alp-cbt2-rac-2025-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
  });
  const alpArmatureCat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper (CBT 2)') && c.subSectionName === 'Other Electrical Trade');
  const armatureTest = alpArmatureCat?.tests.find(t => t.title.includes('Armature') || t.title.includes('2025'));
  if (armatureTest) {
    map.set(`rrb-alp-cbt2-armature-2025-shift-1`, { seriesSlug: 'rrb-alp', testId: armatureTest.id, title: armatureTest.title });
  }

  // 9. RRB NTPC Grad 2026 (24 shifts)
  const ntpcPyp = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2026 Graduate (CBT 1)');
  ntpcPyp?.tests.forEach((t, i) => {
    map.set(`rrb-ntpc-grad-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
  });

  // 10. RRB NTPC Grad 2025 (23 shifts, 25-47)
  const ntpcGrad2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2025 Graduate (CBT 1)');
  ntpcGrad2025?.tests.slice(24).forEach((t, i) => {
    map.set(`rrb-ntpc-grad-2025-shift-${25 + i}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
  });

  // 11. RRB NTPC Grad CBT 2 (Mock 1-5 + Level 5/6 + 2025 Grad)
  const gradCbt2Cat = discoveredRrb['rrb-ntpc']?.categories.find(c => c.sectionName?.includes('Full Test (CBT - 2)') && c.subSectionName?.includes('Foundational'));
  gradCbt2Cat?.tests.slice(0, 5).forEach((t, i) => {
    map.set(`rrb-ntpc-grad-cbt2-mock-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
  });
  const gradLvl6 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 6');
  gradLvl6?.tests.forEach((t, i) => map.set(`rrb-ntpc-grad-cbt2-level6-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title }));
  const gradLvl5 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 5');
  gradLvl5?.tests.forEach((t, i) => map.set(`rrb-ntpc-grad-cbt2-level5-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title }));
  const gradCbt2_2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === '2025 Graduation (CBT 2)');
  gradCbt2_2025?.tests.forEach((t, i) => map.set(`rrb-ntpc-grad-cbt2-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title }));

  // 12. RRB NTPC UG 2026 (32 shifts)
  const ntpcUg2026 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2026 Under Graduate (CBT 1)');
  ntpcUg2026?.tests.forEach((t, i) => {
    map.set(`rrb-ntpc-ug-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
    map.set(`rrb-ntpc-ug-2026-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
  });

  // 13. RRB NTPC UG 2025 (25 shifts, 33-57)
  const ntpcUg2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2025 Under Graduate (CBT 1)');
  ntpcUg2025?.tests.slice(32).forEach((t, i) => {
    map.set(`rrb-ntpc-ug-2025-shift-${33 + i}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
  });

  // 14. RRB NTPC UG CBT 2 (Mock 1-5 + Level 2/3 + 2025 UG)
  const ugCbt2Cat = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName?.includes('Full Test (CBT 2)') && c.subSectionName?.includes('Foundational'));
  ugCbt2Cat?.tests.slice(0, 5).forEach((t, i) => {
    map.set(`rrb-ntpc-ug-cbt2-mock-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
  });
  const ugLvl2 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 2');
  ugLvl2?.tests.forEach((t, i) => map.set(`rrb-ntpc-ug-cbt2-level2-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title }));
  const ugLvl3 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 3');
  ugLvl3?.tests.forEach((t, i) => map.set(`rrb-ntpc-ug-cbt2-level3-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title }));
  const ugCbt2_2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === '2025 UG (CBT 2)');
  ugCbt2_2025?.tests.forEach((t, i) => map.set(`rrb-ntpc-ug-cbt2-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title }));

  // 15. RRB Group D (20 shifts)
  const grpD = discoveredRrb['rrb-group-d']?.categories.find(c => c.subSectionName === '2024 - 2026');
  grpD?.tests.slice(0, 20).forEach((t, i) => {
    map.set(`rrb-group-d-2025-shift-${i + 1}`, { seriesSlug: 'rrb-group-d', testId: t.id, title: t.title });
  });

  // 16. RRB Section Controller (8 shifts)
  const secCtrlCat = discoveredRrb['rrb-section-controller']?.categories.find(c => c.sectionName?.includes('Full Test (New Pattern)'));
  secCtrlCat?.tests.slice(0, 8).forEach((t, i) => {
    map.set(`rrb-section-controller-mock-${i + 1}`, { seriesSlug: 'rrb-section-controller', testId: t.id, title: t.title });
  });

  return map;
}

async function fetchWithCache(seriesSlug, testId) {
  const cacheFile = path.join(CACHE_DIR, `${seriesSlug}_${testId}.html`);
  if (fs.existsSync(cacheFile)) {
    return fs.readFileSync(cacheFile, 'utf8');
  }
  const html = await fetchTestRaw(seriesSlug, testId);
  if (html && html.length > 50000) {
    fs.writeFileSync(cacheFile, html, 'utf8');
  }
  return html;
}

async function restoreShiftImages(customId, meta) {
  try {
    const html = await fetchWithCache(meta.seriesSlug, meta.testId);
    if (!html || html.length < 50000) {
      return 0;
    }

    const { testData, answersData, resolveValue } = extractTestAndAnswersFromHtml(html);
    const resolvedTest = resolveValue(testData);

    if (!resolvedTest || !resolvedTest.sections) {
      return 0;
    }

    let globalQno = 0;
    const updates = [];

    for (const sRef of resolvedTest.sections) {
      const sec = resolveValue(sRef);
      const qs = resolveValue(sec.questions || []);

      for (const qRef of qs) {
        globalQno++;
        const q = resolveValue(qRef);
        const ans = answersData[q._id];

        const rawQEn = resolveValue(q?.en?.value) || '';
        const rawQHn = resolveValue(q?.hn?.value) || '';

        const qImgsEn = extractImagesFromHtml(rawQEn);
        const qImgsHn = extractImagesFromHtml(rawQHn);
        const questionImages = Array.from(new Set([...qImgsEn, ...qImgsHn]));

        const rawOptions = resolveValue(q?.en?.options || []);
        const rawOptionsHn = resolveValue(q?.hn?.options || []);

        const options = rawOptions.map((optRef, oIdx) => {
          const opt = resolveValue(optRef);
          const optHn = resolveValue(rawOptionsHn[oIdx]);

          const rawOptEn = resolveValue(opt?.value) || '';
          const rawOptHn = resolveValue(optHn?.value) || '';

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

        const rawSolEn = resolveValue(ans?.sol?.en?.value);
        const rawSolHn = resolveValue(ans?.sol?.hn?.value);
        const explanationEn = rawSolEn ? cleanHtmlPreservingImages(rawSolEn) : undefined;
        const explanationHi = rawSolHn ? cleanHtmlPreservingImages(rawSolHn) : undefined;

        const hasImages = questionImages.length > 0 ||
                          options.some(o => o.imageUrl) ||
                          (explanationEn && explanationEn.includes('![Diagram]')) ||
                          (explanationHi && explanationHi.includes('![Diagram]'));

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
      return 0;
    }

    // Apply updates concurrently in chunks of 15
    const CHUNK_SIZE = 15;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async u => {
        const patch = {
          question_images: u.question_images,
          options: u.options
        };
        if (u.explanation_en) patch.explanation_en = u.explanation_en;
        if (u.explanation_hi) patch.explanation_hi = u.explanation_hi;

        return supabase
          .from('questions')
          .update(patch)
          .eq('test_id', u.test_id)
          .eq('question_number', u.question_number);
      }));
    }

    console.log(`[RESTORED] ${customId}: ${updates.length} questions updated with authentic diagrams!`);
    return updates.length;
  } catch (err) {
    console.error(`[ERROR] ${customId}:`, err.message);
    return 0;
  }
}

async function main() {
  console.log('=== STARTING COMPLETE REPEATERMOCK IMAGE RESTORATION ===');
  const catalog = buildFullTestCatalog();
  console.log(`Mapped ${catalog.size} official examination shifts.`);

  let totalRestored = 0;
  let processed = 0;

  for (const [customId, meta] of catalog.entries()) {
    processed++;
    process.stdout.write(`(${processed}/${catalog.size}) Checking ${customId}... `);
    const restored = await restoreShiftImages(customId, meta);
    totalRestored += restored;
    if (restored === 0) console.log('None or skipped.');
  }

  console.log('\n========================================');
  console.log(`Image Restoration Complete!`);
  console.log(`Total questions updated with diagrams: ${totalRestored}`);
  console.log('========================================\n');
}

main().catch(console.error);
