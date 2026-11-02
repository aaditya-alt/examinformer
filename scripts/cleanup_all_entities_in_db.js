const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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
  if (!raw) return raw;
  let str = String(raw);

  // Replace reasoning artifacts
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

async function cleanQuestions() {
  console.log('Querying questions with entity glitches...');
  let offset = 0;
  const limit = 500;
  let totalCleaned = 0;

  while (true) {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text_en, question_text_hi, options, explanation_en, explanation_hi')
      .or('question_text_en.ilike.%&amp;%,question_text_en.ilike.%@amp%,question_text_en.ilike.%&deg;%,question_text_en.ilike.%&ang;%,question_text_en.ilike.%&minus;%,question_text_en.ilike.%&times;%,question_text_en.ilike.%&divide;%')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Fetch error:', error);
      break;
    }

    if (!questions || questions.length === 0) {
      console.log('No more questions matching criteria.');
      break;
    }

    console.log(`Processing batch of ${questions.length} questions (offset ${offset})...`);

    for (const q of questions) {
      const newEn = decodeAllEntities(q.question_text_en);
      const newHi = decodeAllEntities(q.question_text_hi);
      const newExpEn = decodeAllEntities(q.explanation_en);
      const newExpHi = decodeAllEntities(q.explanation_hi);

      let optionsChanged = false;
      const newOptions = Array.isArray(q.options) ? q.options.map((opt) => {
        const textEn = decodeAllEntities(opt.text_en || opt.text || '');
        const textHi = decodeAllEntities(opt.text_hi || opt.text || '');
        if (textEn !== (opt.text_en || opt.text) || textHi !== (opt.text_hi || opt.text)) {
          optionsChanged = true;
        }
        return {
          ...opt,
          text_en: textEn,
          text_hi: textHi
        };
      }) : q.options;

      const hasChange =
        newEn !== q.question_text_en ||
        newHi !== q.question_text_hi ||
        newExpEn !== q.explanation_en ||
        newExpHi !== q.explanation_hi ||
        optionsChanged;

      if (hasChange) {
        const { error: upErr } = await supabase
          .from('questions')
          .update({
            question_text_en: newEn,
            question_text_hi: newHi,
            options: newOptions,
            explanation_en: newExpEn,
            explanation_hi: newExpHi
          })
          .eq('id', q.id);

        if (upErr) {
          console.error(`Error updating question ${q.id}:`, upErr);
        } else {
          totalCleaned++;
        }
      }
    }

    // Since we updated them in-place, they won't match the .or(...) filter next time if we re-query from offset 0,
    // but if we use pagination, let's keep offset 0 if rows disappear or increment if some didn't change
    if (questions.length < limit) break;
  }

  console.log(`Total questions successfully cleaned: ${totalCleaned}`);
}

cleanQuestions().catch(console.error);
