const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rarr;/g, '→')
    .replace(/&larr;/g, '←')
    .replace(/&times;/g, '×')
    .replace(/&plusmn;/g, '±')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&ne;/g, '≠')
    .replace(/&radic;/g, '√');
}

function cleanHtmlToKaTeX(html) {
  if (!html) return '';
  let text = decodeHtmlEntities(html);
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

async function fetchTestFromRepeater(seriesSlug, testId) {
  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://repeatermock.com',
    'Referer': `https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/attempt`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  const startRes = await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ seriesSlug, reattempt: false })
  });

  const cookie = startRes.headers.get('set-cookie')?.split(';')[0] || '';

  await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/submit`, {
    method: 'POST',
    headers: { ...headers, Cookie: cookie },
    body: JSON.stringify({ task: 'submit', responses: {}, currentQuestion: 0 })
  });

  const solRes = await fetch(`https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/solution`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Cookie: cookie
    }
  });

  const html = await solRes.text();
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];

  let unescaped = null;
  for (const s of scripts) {
    if (s.includes('answersData') && s.includes('testData')) {
      const prefix = '<script>self.__next_f.push([1,"';
      const start = s.indexOf(prefix);
      const end = s.lastIndexOf('"])</script>');
      if (start !== -1 && end !== -1) {
        unescaped = JSON.parse(`"${s.substring(start + prefix.length, end)}"`);
        break;
      }
    }
  }

  if (!unescaped) {
    throw new Error(`Could not parse test payload for ${testId}`);
  }

  const tdStart = unescaped.indexOf('"testData":') + 11;
  const adStart = unescaped.indexOf('"answersData":') + 14;
  const rdStart = unescaped.indexOf(',"responsesData":');

  const answersData = JSON.parse(unescaped.slice(adStart, rdStart));
  const testData = JSON.parse(unescaped.slice(tdStart, unescaped.indexOf(',"answersData":')));

  return { testData, answersData };
}

async function main() {
  const testsToIngest = [
    // ── 1. SSC CGL 2025 Tier 1 ──
    {
      seriesSlug: 'ssc-cgl',
      testId: '6a0f3ef125f9d428c136a83a',
      customId: 'cgl-2025-12-sep-shift-1',
      displayTitle: 'SSC CGL 2025 Tier-1 — 12 Sep 2025 (Shift 1)',
      examCode: 'ssc-cgl-tier1',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-cgl',
      testId: '6a0f3ef35a73de9e21cdf098',
      customId: 'cgl-2025-12-sep-shift-2',
      displayTitle: 'SSC CGL 2025 Tier-1 — 12 Sep 2025 (Shift 2)',
      examCode: 'ssc-cgl-tier1',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-cgl',
      testId: '6a0f3ef579735237a77695ea',
      customId: 'cgl-2025-12-sep-shift-3',
      displayTitle: 'SSC CGL 2025 Tier-1 — 12 Sep 2025 (Shift 3)',
      examCode: 'ssc-cgl-tier1',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-cgl',
      testId: '6a0f3ef7cda71d26928e6736',
      customId: 'cgl-2025-13-sep-shift-1',
      displayTitle: 'SSC CGL 2025 Tier-1 — 13 Sep 2025 (Shift 1)',
      examCode: 'ssc-cgl-tier1',
      examFamily: 'ssc'
    },

    // ── 2. SSC CGL 2025 Tier 2 ──
    {
      seriesSlug: 'ssc-cgl',
      testId: '698f0d6b29167fd824cbf156',
      customId: 'cgl-2025-tier2-19-jan-shift-1',
      displayTitle: 'SSC CGL 2025 Tier-2 — 19 Jan 2026 (Shift 1)',
      examCode: 'ssc-cgl-tier2',
      examFamily: 'ssc'
    },

    // ── 3. SSC CHSL 2025 Tier 1 ──
    {
      seriesSlug: 'ssc-chsl',
      testId: '6a6c7fe48ce1304481cc26c8',
      customId: 'chsl-2025-12-nov-shift-2',
      displayTitle: 'SSC CHSL 2025 Tier-1 — 12 Nov 2025 (Shift 2)',
      examCode: 'ssc-chsl-tier1',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-chsl',
      testId: '6a6c7fe6bb31fa05de9265b4',
      customId: 'chsl-2025-12-nov-shift-3',
      displayTitle: 'SSC CHSL 2025 Tier-1 — 12 Nov 2025 (Shift 3)',
      examCode: 'ssc-chsl-tier1',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-chsl',
      testId: '6a6c7fe8b30bbc0137dc339e',
      customId: 'chsl-2025-13-nov-shift-1',
      displayTitle: 'SSC CHSL 2025 Tier-1 — 13 Nov 2025 (Shift 1)',
      examCode: 'ssc-chsl-tier1',
      examFamily: 'ssc'
    },

    // ── 4. SSC MTS 2025 (Held in early 2026) ──
    {
      seriesSlug: 'ssc-mts',
      testId: '69ccf66bc98fc8d94d3656b8',
      customId: 'mts-2025-04-feb-shift-3',
      displayTitle: 'SSC MTS 2025 — 04 Feb 2026 (Shift 3)',
      examCode: 'ssc-mts',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-mts',
      testId: '69ccf66c8c510d4f46752797',
      customId: 'mts-2025-05-feb-shift-1',
      displayTitle: 'SSC MTS 2025 — 05 Feb 2026 (Shift 1)',
      examCode: 'ssc-mts',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-mts',
      testId: '69ccf66c303524cf035db362',
      customId: 'mts-2025-05-feb-shift-2',
      displayTitle: 'SSC MTS 2025 — 05 Feb 2026 (Shift 2)',
      examCode: 'ssc-mts',
      examFamily: 'ssc'
    },

    // ── 5. SSC GD Constable 2025 (Held in 2026) ──
    {
      seriesSlug: 'ssc-gd-constable',
      testId: '6a339de2c2f5995376aa18bb',
      customId: 'gd-2025-27-apr-shift-2',
      displayTitle: 'SSC GD 2025 — 27 Apr 2026 (Shift 2)',
      examCode: 'ssc-gd',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-gd-constable',
      testId: '6a339de45222ca0f0cafa8fa',
      customId: 'gd-2025-28-apr-shift-1',
      displayTitle: 'SSC GD 2025 — 28 Apr 2026 (Shift 1)',
      examCode: 'ssc-gd',
      examFamily: 'ssc'
    },

    // ── 6. RRB NTPC Graduate 2025 ──
    {
      seriesSlug: 'rrb-ntpc',
      testId: '68e502ef9b8d9983844d6dce',
      customId: 'ntpc-grad-2025-05-jun-shift-1',
      displayTitle: 'RRB NTPC Graduate 2025 CBT-1 — 05 Jun 2025 (Shift 1)',
      examCode: 'rrb-ntpc-cbt1',
      examFamily: 'rrb'
    },
    {
      seriesSlug: 'rrb-ntpc',
      testId: '68e502f0bacdad761d673172',
      customId: 'ntpc-grad-2025-05-jun-shift-2',
      displayTitle: 'RRB NTPC Graduate 2025 CBT-1 — 05 Jun 2025 (Shift 2)',
      examCode: 'rrb-ntpc-cbt1',
      examFamily: 'rrb'
    },

    // ── 7. RRB NTPC Under Graduate 2025 ──
    {
      seriesSlug: 'rrb-ntpc',
      testId: '68e51176bdf6a7fec04d06f1',
      customId: 'ntpc-ug-2025-07-aug-shift-1',
      displayTitle: 'RRB NTPC (UG) 2025 CBT-1 — 07 Aug 2025 (Shift 1)',
      examCode: 'rrb-ntpc-cbt1',
      examFamily: 'rrb'
    },

    // ── 8. RRB ALP 2025 (Held in Feb 2026) ──
    {
      seriesSlug: 'rrb-alp',
      testId: '69ccf7929c7102e60c28c1be',
      customId: 'alp-2025-13-feb-shift-1',
      displayTitle: 'RRB ALP 2025 CBT-1 — 13 Feb 2026 (Shift 1)',
      examCode: 'rrb-alp-cbt1',
      examFamily: 'rrb'
    },
    {
      seriesSlug: 'rrb-alp',
      testId: '69ccf793608516fd8fb56791',
      customId: 'alp-2025-16-feb-shift-1',
      displayTitle: 'RRB ALP 2025 CBT-1 — 16 Feb 2026 (Shift 1)',
      examCode: 'rrb-alp-cbt1',
      examFamily: 'rrb'
    }
  ];

  console.log(`Starting master ingestion for ${testsToIngest.length} official 2025 shift papers...`);

  const processedBundle = [];

  for (const item of testsToIngest) {
    try {
      console.log(`\nFetching ${item.displayTitle} (${item.testId})...`);
      const { testData, answersData } = await fetchTestFromRepeater(item.seriesSlug, item.testId);

      let globalQno = 1;
      const formattedSections = testData.sections.map((sec, sIdx) => {
        const questions = sec.questions.map((q) => {
          const ans = answersData[q._id];
          const correctOptionNum = parseInt(ans?.correctOption || '1', 10);

          const options = (q.en?.options || []).map((opt, oIdx) => ({
            id: oIdx + 1,
            text: cleanHtmlToKaTeX(opt.value),
            textHi: q.hn?.options?.[oIdx]?.value ? cleanHtmlToKaTeX(q.hn.options[oIdx].value) : undefined
          }));

          const explanationEn = ans?.sol?.en?.value ? cleanHtmlToKaTeX(ans.sol.en.value) : `Official Key: Option (${correctOptionNum})`;
          const explanationHi = ans?.sol?.hn?.value ? cleanHtmlToKaTeX(ans.sol.hn.value) : null;

          const qItem = {
            id: `${item.customId}_q${globalQno}`,
            qno: globalQno,
            questionText: cleanHtmlToKaTeX(q.en?.value || 'Question text not available'),
            questionTextHi: q.hn?.value ? cleanHtmlToKaTeX(q.hn.value) : undefined,
            options,
            correctOption: correctOptionNum,
            explanation: explanationEn,
            explanationHi,
            marks: q.posMarks || 2.0,
            negativeMarks: q.negMarks || 0.5,
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

      const totalQuestions = formattedSections.reduce((sum, s) => sum + s.questions.length, 0);
      const totalMarks = formattedSections.reduce((sum, s) => sum + s.questions.reduce((m, q) => m + q.marks, 0), 0);

      const testRecord = {
        id: item.customId,
        title: item.displayTitle,
        examCode: item.examCode,
        examFamily: item.examFamily,
        type: 'full_mock',
        durationMinutes: testData.duration || 60,
        totalMarks,
        totalQuestions,
        isPublished: true,
        hasSectionalTiming: true,
        sectionalTimingMinutes: Math.floor((testData.duration || 60) / Math.max(1, formattedSections.length)),
        sections: formattedSections
      };

      processedBundle.push(testRecord);
      console.log(`  Processed: ${item.displayTitle} (${totalQuestions} Qs)`);

      // ── Supabase Ingestion ──
      // 1. Insert test
      const { error: tErr } = await supabase.from('tests').upsert({
        id: testRecord.id,
        title: testRecord.title,
        exam_code: testRecord.examCode,
        type: 'pyq',
        duration_minutes: testRecord.durationMinutes,
        total_marks: testRecord.totalMarks,
        total_questions: testRecord.totalQuestions,
        is_published: true
      }, { onConflict: 'id' });

      if (tErr) console.warn(`Supabase test error on ${testRecord.id}:`, tErr.message);

      // 2. Insert sections
      const secRows = testRecord.sections.map((s, idx) => ({
        id: `${testRecord.id}_sec_${idx + 1}`,
        test_id: testRecord.id,
        name: s.name,
        order_index: idx,
        marks_per_question: s.questions[0]?.marks || 2,
        negative_marks: s.questions[0]?.negativeMarks || 0.5
      }));

      const { error: secErr } = await supabase.from('test_sections').upsert(secRows, { onConflict: 'id' });
      if (secErr) console.warn(`Supabase sec error on ${testRecord.id}:`, secErr.message);

      // 3. Insert questions
      const qRows = [];
      testRecord.sections.forEach((sec, sIdx) => {
        const secDbId = `${testRecord.id}_sec_${sIdx + 1}`;
        sec.questions.forEach((q, qIdx) => {
          qRows.push({
            id: q.id,
            test_id: testRecord.id,
            section_id: secDbId,
            question_number: q.qno,
            question_text_en: q.questionText,
            question_text_hi: q.questionTextHi || '',
            question_images: [],
            options: q.options,
            correct_option_index: q.correctOption,
            explanation_en: q.explanation,
            explanation_hi: q.explanationHi || null,
            is_bonus: false
          });
        });
      });

      for (let i = 0; i < qRows.length; i += 50) {
        const batch = qRows.slice(i, i + 50);
        const { error: qErr } = await supabase.from('questions').upsert(batch, { onConflict: 'id' });
        if (qErr) console.error(`  Supabase question batch error on ${testRecord.id}:`, qErr.message);
      }

      console.log(`  Synced ${qRows.length} questions to Supabase.`);

    } catch (err) {
      console.error(`Failed on ${item.customId}:`, err.message);
    }
  }

  // Save exclusively to bundle file
  const bundlePath = path.join(__dirname, '../src/data/mock-tests-bundle.json');
  fs.writeFileSync(bundlePath, JSON.stringify(processedBundle, null, 2));
  console.log(`\nMASTER INGESTION COMPLETE!`);
  console.log(`Total 2025 PYQ Tests in bundle: ${processedBundle.length}`);
  console.log(`Total Questions: ${processedBundle.reduce((sum, t) => sum + t.totalQuestions, 0)}`);
}

main().catch(console.error);
