const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

const discoveredSsc = require('./all_2025_discovered_shifts.json');
const discoveredRrb = require('./rrb_discovered_tests.json');

async function checkCatalogMatching() {
  const { data: dbTests, error } = await supabase.from('tests').select('id, title, exam_code');
  if (error) {
    console.error('Error fetching tests:', error);
    return;
  }

  const catalog = new Map();

  // 1. CGL Tier 1 (45)
  const cglPyp = discoveredSsc['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier I)'));
  cglPyp?.subSections.find(s => s.name === '2025')?.tests.forEach((t, i) => {
    catalog.set(`ssc-cgl-2025-shift-${i + 1}`, { seriesSlug: 'ssc-cgl', testId: t.id, title: t.title });
  });

  // 2. CGL Tier 2 (1)
  const cglTier2 = discoveredSsc['ssc-cgl']?.sections.find(s => s.name.includes('Previous Year Paper (Tier II)'));
  cglTier2?.subSections.find(s => s.name.includes('2025 - 2026'))?.tests.forEach((t, i) => {
    catalog.set(`ssc-cgl-2025-tier2-shift-${i + 1}`, { seriesSlug: 'ssc-cgl', testId: t.id, title: t.title });
  });

  // 3. CHSL Tier 1 (50)
  const chslPyp = discoveredSsc['ssc-chsl']?.sections.find(s => s.name === 'PYP (Tier - I)');
  chslPyp?.subSections.find(s => s.name === '2025')?.tests.forEach((t, i) => {
    catalog.set(`ssc-chsl-2025-shift-${i + 1}`, { seriesSlug: 'ssc-chsl', testId: t.id, title: t.title });
  });

  // 4. MTS (16)
  const mtsPyp = discoveredSsc['ssc-mts']?.sections.find(s => s.name.includes('Previous Year Paper'));
  mtsPyp?.subSections.find(s => s.name === '2025')?.tests.forEach((t, i) => {
    catalog.set(`ssc-mts-2025-shift-${i + 1}`, { seriesSlug: 'ssc-mts', testId: t.id, title: t.title });
  });

  // 5. RRB ALP 2025 (11)
  const alp2025Cat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper') && c.subSectionName === '2025');
  alp2025Cat?.tests.forEach((t, i) => {
    catalog.set(`rrb-alp-2025-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
  });

  // 6. RRB ALP 2024 (15)
  const alp2024Cat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper') && c.subSectionName === '2024');
  alp2024Cat?.tests.forEach((t, i) => {
    catalog.set(`rrb-alp-2024-cbt1-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
  });

  // 7. RRB NTPC Grad 2026 (24)
  const ntpcPyp = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2026 Graduate (CBT 1)');
  ntpcPyp?.tests.forEach((t, i) => {
    catalog.set(`rrb-ntpc-grad-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
  });

  // 8. RRB NTPC Grad 2025 (23)
  const ntpcGrad2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2025 Graduate (CBT 1)');
  ntpcGrad2025?.tests.slice(24).forEach((t, i) => {
    catalog.set(`rrb-ntpc-grad-2025-shift-${25 + i}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
  });

  // 9. RRB NTPC UG 2026 (32)
  const ntpcUg2026 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2026 Under Graduate (CBT 1)');
  ntpcUg2026?.tests.forEach((t, i) => {
    catalog.set(`rrb-ntpc-ug-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
  });

  // 10. RRB NTPC UG 2025 (25)
  const ntpcUg2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.subSectionName === '2025 Under Graduate (CBT 1)');
  ntpcUg2025?.tests.slice(32).forEach((t, i) => {
    catalog.set(`rrb-ntpc-ug-2025-shift-${33 + i}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
  });

  // 11. RRB Group D (20)
  const grpD = discoveredRrb['rrb-group-d']?.categories.find(c => c.subSectionName === '2024 - 2026');
  grpD?.tests.slice(0, 20).forEach((t, i) => {
    catalog.set(`rrb-group-d-2025-shift-${i + 1}`, { seriesSlug: 'rrb-group-d', testId: t.id, title: t.title });
  });

  // 12. RRB ALP 2026 CBT 1 (11)
  alp2025Cat?.tests.slice(0, 11).forEach((t, i) => {
    catalog.set(`rrb-alp-2026-cbt1-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
  });

  // 13. RRB NTPC UG 2026 CBT 1 (32)
  ntpcUg2026?.tests.forEach((t, i) => {
    catalog.set(`rrb-ntpc-ug-2026-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
  });

  // 14. RRB NTPC UG CBT 2 (5)
  const ugCbt2Cat = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName?.includes('Full Test (CBT 2)') && c.subSectionName?.includes('Foundational'));
  ugCbt2Cat?.tests.slice(0, 5).forEach((t, i) => {
    catalog.set(`rrb-ntpc-ug-cbt2-mock-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title });
  });

  // 15. RRB NTPC Grad CBT 2 (5)
  const gradCbt2Cat = discoveredRrb['rrb-ntpc']?.categories.find(c => c.sectionName?.includes('Full Test (CBT - 2)') && c.subSectionName?.includes('Foundational'));
  gradCbt2Cat?.tests.slice(0, 5).forEach((t, i) => {
    catalog.set(`rrb-ntpc-grad-cbt2-mock-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title });
  });

  // 16. RRB Section Controller (8)
  const secCtrlCat = discoveredRrb['rrb-section-controller']?.categories.find(c => c.sectionName?.includes('Full Test (New Pattern)'));
  secCtrlCat?.tests.slice(0, 8).forEach((t, i) => {
    catalog.set(`rrb-section-controller-mock-${i + 1}`, { seriesSlug: 'rrb-section-controller', testId: t.id, title: t.title });
  });

  // 17. RRB ALP CBT 2 (RAC & Armature)
  const alpRacCat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper (CBT 2)') && c.subSectionName === 'RAC Mechanic');
  alpRacCat?.tests.forEach((t, i) => {
    catalog.set(`rrb-alp-cbt2-rac-2025-shift-${i + 1}`, { seriesSlug: 'rrb-alp', testId: t.id, title: t.title });
  });
  const alpArmatureCat = discoveredRrb['rrb-alp']?.categories.find(c => c.sectionName.includes('Previous Year Paper (CBT 2)') && c.subSectionName === 'Other Electrical Trade');
  const armatureTest = alpArmatureCat?.tests.find(t => t.title.includes('Armature') || t.title.includes('2025'));
  if (armatureTest) {
    catalog.set(`rrb-alp-cbt2-armature-2025-shift-1`, { seriesSlug: 'rrb-alp', testId: armatureTest.id, title: armatureTest.title });
  }

  // 19. RRB CBT 2 Level tests & 2025 CBT 2
  const gradLvl6 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 6');
  gradLvl6?.tests.forEach((t, i) => catalog.set(`rrb-ntpc-grad-cbt2-level6-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title }));

  const gradLvl5 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 5');
  gradLvl5?.tests.forEach((t, i) => catalog.set(`rrb-ntpc-grad-cbt2-level5-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title }));

  const ugLvl2 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 2');
  ugLvl2?.tests.forEach((t, i) => catalog.set(`rrb-ntpc-ug-cbt2-level2-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title }));

  const gradCbt2_2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === '2025 Graduation (CBT 2)');
  gradCbt2_2025?.tests.forEach((t, i) => catalog.set(`rrb-ntpc-grad-cbt2-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc', testId: t.id, title: t.title }));

  const ugCbt2_2025 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === '2025 UG (CBT 2)');
  ugCbt2_2025?.tests.forEach((t, i) => catalog.set(`rrb-ntpc-ug-cbt2-2025-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title }));

  const ugLvl3 = discoveredRrb['rrb-ntpc-ug']?.categories.find(c => c.sectionName === 'PYP (CBT 2)' && c.subSectionName === 'Level 3');
  ugLvl3?.tests.forEach((t, i) => catalog.set(`rrb-ntpc-ug-cbt2-level3-shift-${i + 1}`, { seriesSlug: 'rrb-ntpc-ug', testId: t.id, title: t.title }));

  const chslTier2 = discoveredSsc['ssc-chsl']?.sections.find(s => s.name.includes('Tier - II') || s.name.includes('Tier 2') || s.name.includes('New Pattern'));
  const chslTier2Test = chslTier2?.subSections?.[0]?.tests?.[0];
  if (chslTier2Test) {
    catalog.set(`ssc-chsl-2025-tier2-shift-1`, { seriesSlug: 'ssc-chsl', testId: chslTier2Test.id, title: chslTier2Test.title });
  }

  console.log(`Compiled catalog of ${catalog.size} shifts.`);
  let matched = 0;
  let unmatched = [];
  for (const t of dbTests) {
    if (t.id.includes('selection-post')) continue;
    if (catalog.has(t.id)) {
      matched++;
    } else {
      unmatched.push(t.id);
    }
  }

  console.log(`Matched with Supabase: ${matched} tests`);
  console.log(`Unmatched non-selection-post tests: ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.log('Sample unmatched:', unmatched.slice(0, 10));
  }
}

checkCatalogMatching();
