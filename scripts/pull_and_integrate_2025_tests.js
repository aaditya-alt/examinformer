const fs = require('fs');

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

async function fetchAndConvertTest({ seriesSlug, testId, customId, examCode, examFamily }) {
  console.log(`\nFetching ${seriesSlug} [${testId}] -> ${customId}...`);

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
    throw new Error(`Failed to unescape script for ${testId}`);
  }

  const tdStart = unescaped.indexOf('"testData":') + 11;
  const adStart = unescaped.indexOf('"answersData":') + 14;
  const rdStart = unescaped.indexOf(',"responsesData":');

  const answersData = JSON.parse(unescaped.slice(adStart, rdStart));
  const testData = JSON.parse(unescaped.slice(tdStart, unescaped.indexOf(',"answersData":')));

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

      const explanation = ans?.sol?.en?.value ? cleanHtmlToKaTeX(ans.sol.en.value) : `Official Key: Option (${correctOptionNum})`;

      const qItem = {
        id: `${customId}_q${globalQno}`,
        qno: globalQno,
        questionText: cleanHtmlToKaTeX(q.en?.value || 'Question text not available'),
        questionTextHi: q.hn?.value ? cleanHtmlToKaTeX(q.hn.value) : undefined,
        options,
        correctOption: correctOptionNum,
        explanation,
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

  return {
    id: customId,
    title: testData.title,
    examCode,
    examFamily,
    type: 'full_mock',
    durationMinutes: testData.duration || 60,
    totalMarks,
    totalQuestions,
    isPublished: true,
    hasSectionalTiming: true,
    sectionalTimingMinutes: Math.floor((testData.duration || 60) / Math.max(1, formattedSections.length)),
    sections: formattedSections
  };
}

async function run() {
  const testsToPull = [
    {
      seriesSlug: 'ssc-cgl',
      testId: '6a0f3ef579735237a77695ea',
      customId: 'cgl-2025-12-sep-shift-3',
      examCode: 'ssc-cgl-tier1',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-cgl',
      testId: '6a0f3ef7cda71d26928e6736',
      customId: 'cgl-2025-13-sep-shift-1',
      examCode: 'ssc-cgl-tier1',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'ssc-mts',
      testId: '69ccf66c8c510d4f46752797',
      customId: 'mts-2025-05-feb-shift-1',
      examCode: 'ssc-mts',
      examFamily: 'ssc'
    },
    {
      seriesSlug: 'rrb-alp',
      testId: '69ccf793608516fd8fb56791',
      customId: 'alp-2025-16-feb-shift-1',
      examCode: 'rrb-alp-cbt1',
      examFamily: 'rrb'
    }
  ];

  const bundlePath = 'src/data/mock-tests-bundle.json';
  const currentBundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

  for (const item of testsToPull) {
    try {
      const converted = await fetchAndConvertTest(item);
      const existingIdx = currentBundle.findIndex(t => t.id === converted.id);
      if (existingIdx !== -1) {
        currentBundle[existingIdx] = converted;
        console.log(`Updated ${converted.id} in bundle`);
      } else {
        currentBundle.unshift(converted);
        console.log(`Added ${converted.id} (${converted.totalQuestions} Qs) to bundle`);
      }
    } catch (e) {
      console.error(`Failed to ingest ${item.customId}:`, e.message);
    }
  }

  fs.writeFileSync(bundlePath, JSON.stringify(currentBundle, null, 2));
  console.log(`\nSuccessfully updated bundle! Total tests now: ${currentBundle.length}`);
}

run().catch(console.error);
