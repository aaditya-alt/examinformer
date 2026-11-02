const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const {
  fetchTestRaw,
  extractTestAndAnswersFromHtml
} = require('./pipeline_utils');

const envContent = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = trimmed.split('=')[1].replace(/['"]/g, '').trim();
  if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = trimmed.split('=')[1].replace(/['"]/g, '').trim();
  if (!supabaseKey && trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = trimmed.split('=')[1].replace(/['"]/g, '').trim();
}
const supabase = createClient(supabaseUrl, supabaseKey);

function decodeAllEntities(raw) {
  if (!raw) return '';
  let str = String(raw);

  // Replace reasoning artifact
  str = str.replace(/@amp;?/gi, '&');

  const entityMap = {
    '&quot;': '"',
    '&#039;': "'",
    '&#39;': "'",
    '&apos;': "'",
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&bull;': '•',
    '&lt;': '<',
    '&gt;': '>',
    '&sup2;': '²',
    '&sup3;': '³',
    '&rArr;': '⇒',
    '&lArr;': '⇐',
    '&hArr;': '⇔',
    '&there4;': '∴',
    '&minus;': '−',
    '&times;': '×',
    '&divide;': '÷',
    '&plusmn;': '±',
    '&asymp;': '≈',
    '&ne;': '≠',
    '&le;': '≤',
    '&ge;': '≥',
    '&ang;': '∠',
    '&angle;': '∠',
    '&deg;': '°',
    '&Delta;': 'Δ',
    '&delta;': 'δ',
    '&pi;': 'π',
    '&theta;': 'θ',
    '&alpha;': 'α',
    '&beta;': 'β',
    '&gamma;': 'γ',
    '&infin;': '∞',
    '&sim;': '∼',
    '&cong;': '≅',
    '&perp;': '⊥',
    '&radic;': '√',
    '&Omega;': 'Ω',
    '&pound;': '£',
    '&nbsp;': ' '
  };

  for (let pass = 0; pass < 3; pass++) {
    for (const [ent, rep] of Object.entries(entityMap)) {
      if (str.includes(ent)) {
        str = str.split(ent).join(rep);
      }
    }
    if (str.includes('&amp;')) {
      str = str.replace(/&amp;/g, '&');
    }
    str = str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    str = str.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  }

  str = str.replace(/<sup>2<\/sup>/gi, '²');
  str = str.replace(/<sup>3<\/sup>/gi, '³');
  str = str.replace(/<sup>4<\/sup>/gi, '⁴');
  str = str.replace(/<sup>5<\/sup>/gi, '⁵');
  str = str.replace(/<sup>6<\/sup>/gi, '⁶');
  str = str.replace(/<sup>([0-9a-zA-Z+-]+)<\/sup>/gi, '^($1)');
  str = str.replace(/<sub>([0-9a-zA-Z+-]+)<\/sub>/gi, '_($1)');

  return str;
}

function extractImages(html) {
  if (!html) return [];
  const decoded = decodeAllEntities(html);
  const urls = [];
  const regex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(decoded)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

function cleanHtmlText(html) {
  if (!html) return '';
  let text = decodeAllEntities(html);
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
  let text = decodeAllEntities(html);
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
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

async function main() {
  console.log('--- Ingesting Real SSC CHSL 2025 Tier-2 Paper ---');
  const customId = 'ssc-chsl-2025-tier2-shift-1';
  const repeaterTestId = '6971fa3776b6592a54d68ba7';
  
  const html = await fetchTestRaw('ssc-chsl', repeaterTestId);
  const { testData, answersData, resolveValue } = extractTestAndAnswersFromHtml(html);
  
  if (!testData || !testData.sections) {
    console.error('Failed to parse repeatermock HTML for CHSL Tier 2');
    return;
  }

  // Flatten all questions across the 3 sections in order
  let globalQno = 0;
  const questionsToInsert = [];

  for (let sIdx = 0; sIdx < testData.sections.length; sIdx++) {
    const s = testData.sections[sIdx];
    for (const q of s.questions) {
      globalQno++;
      const ans = answersData[q._id];
      const rawQEn = resolveValue(q.en?.value) || '';
      const rawQHn = resolveValue(q.hn?.value) || '';

      const qImgsEn = extractImages(rawQEn);
      const qImgsHn = extractImages(rawQHn);
      const questionImages = Array.from(new Set([...qImgsEn, ...qImgsHn]));

      const options = (q.en?.options || []).map((opt, oIdx) => {
        const rawOptEn = resolveValue(opt.value) || '';
        const rawOptHn = resolveValue(q.hn?.options?.[oIdx]?.value) || '';
        const optImgs = extractImages(rawOptEn).concat(extractImages(rawOptHn));
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

      // Find correct option index (1-based)
      let correctOptionIndex = 1;
      if (ans && ans.ans !== undefined) {
        correctOptionIndex = Number(ans.ans);
      }

      const rawSolEn = ans?.sol?.en?.value;
      const rawSolHn = ans?.sol?.hn?.value;
      const explanationEn = rawSolEn ? cleanHtmlText(resolveValue(rawSolEn)) : undefined;
      const explanationHi = rawSolHn ? cleanHtmlText(resolveValue(rawSolHn)) : undefined;

      // Assign section_id based on CHSL Tier 2 official pattern
      // 1-30: Mathematical Abilities
      // 31-60: Reasoning and General Intelligence
      // 61-100: English Language and Comprehension
      // 101-120: General Awareness
      // 121-135: Computer Knowledge
      let sectionName = 'Mathematical Abilities';
      if (globalQno > 30 && globalQno <= 60) sectionName = 'Reasoning and General Intelligence';
      else if (globalQno > 60 && globalQno <= 100) sectionName = 'English Language and Comprehension';
      else if (globalQno > 100 && globalQno <= 120) sectionName = 'General Awareness';
      else if (globalQno > 120) sectionName = 'Computer Knowledge';

      questionsToInsert.push({
        test_id: customId,
        question_number: globalQno,
        question_id_str: `${customId}_q${globalQno}`,
        section_id: null,
        question_text_en: cleanHtmlText(rawQEn),
        question_text_hi: cleanHtmlText(rawQHn) || cleanHtmlText(rawQEn),
        question_images: questionImages,
        options,
        correct_option_index: correctOptionIndex,
        explanation_en: explanationEn,
        explanation_hi: explanationHi,
        is_bonus: false
      });
    }
  }

  console.log(`Prepared ${questionsToInsert.length} questions for ${customId}.`);
  console.log(`Sample Q#9 (triangle):`, questionsToInsert[8]?.question_text_en);
  console.log(`Sample Q#37 (figure series):`, questionsToInsert[36]?.question_images);
  console.log(`Sample Q#48 (mirror image):`, questionsToInsert[47]?.question_images);

  // Update tests row in Supabase
  const { error: testUpErr } = await supabase
    .from('tests')
    .upsert({
      id: customId,
      title: 'SSC CHSL 2025 Tier-2 — 10 Mar, 2026 Shift 1',
      exam_code: 'ssc-chsl-tier2',
      total_questions: 135,
      total_marks: 360,
      duration_minutes: 135,
      is_published: true
    });
  if (testUpErr) {
    console.error('Error updating test table:', testUpErr);
    return;
  }
  console.log('Updated tests table for CHSL Tier 2.');

  // Delete previous synthetic questions for this test
  const { error: delErr } = await supabase.from('questions').delete().eq('test_id', customId);
  if (delErr) {
    console.error('Error deleting old questions:', delErr);
    return;
  }
  console.log('Removed old synthetic questions.');

  // Insert real questions in chunks of 50
  for (let i = 0; i < questionsToInsert.length; i += 50) {
    const chunk = questionsToInsert.slice(i, i + 50);
    const { error: insErr } = await supabase.from('questions').insert(chunk);
    if (insErr) {
      console.error(`Error inserting chunk ${i} - ${i + chunk.length}:`, insErr);
    } else {
      console.log(`Inserted questions ${i + 1} to ${i + chunk.length}`);
    }
  }

  console.log('Successfully completed real CHSL Tier-2 test ingestion!');
}

main().catch(console.error);
