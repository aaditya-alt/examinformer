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
  
  // Replace <p>, </p>, <div>, </div>, <br/> with clean linebreaks
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

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Clean multiple linebreaks and spaces
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

async function convertTest(seriesSlug, testId, customId, examCode, examFamily) {
  console.log(`Starting conversion for ${seriesSlug} / ${testId}...`);

  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://repeatermock.com',
    'Referer': `https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/attempt`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  // Step 1: Start
  const startRes = await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ seriesSlug, reattempt: false })
  });

  const cookie = startRes.headers.get('set-cookie')?.split(';')[0] || '';

  // Step 2: Submit
  await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/submit`, {
    method: 'POST',
    headers: { ...headers, Cookie: cookie },
    body: JSON.stringify({ task: 'submit', responses: {}, currentQuestion: 0 })
  });

  // Step 3: Fetch solution
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
    throw new Error('Could not extract unescaped script');
  }

  const tdStart = unescaped.indexOf('"testData":') + 11;
  const adStart = unescaped.indexOf('"answersData":') + 14;
  const rdStart = unescaped.indexOf(',"responsesData":');

  const answersData = JSON.parse(unescaped.slice(adStart, rdStart));
  const testData = JSON.parse(unescaped.slice(tdStart, unescaped.indexOf(',"answersData":')));

  console.log(`Parsed: "${testData.title}" (${testData.sections.length} sections)`);

  let globalQno = 1;
  const formattedSections = testData.sections.map((sec, sIdx) => {
    const questions = sec.questions.map((q) => {
      const ans = answersData[q._id];
      const correctOptionNum = parseInt(ans?.correctOption || '1', 10);

      // Options
      const options = (q.en.options || []).map((opt, oIdx) => ({
        id: oIdx + 1,
        text: cleanHtmlToKaTeX(opt.value),
        textHi: q.hn?.options?.[oIdx]?.value ? cleanHtmlToKaTeX(q.hn.options[oIdx].value) : undefined
      }));

      const explanation = ans?.sol?.en?.value ? cleanHtmlToKaTeX(ans.sol.en.value) : `Official Key: Option (${correctOptionNum})`;

      const qItem = {
        id: `${customId}_q${globalQno}`,
        qno: globalQno,
        questionText: cleanHtmlToKaTeX(q.en.value),
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

  const convertedTest = {
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
    sectionalTimingMinutes: 15,
    sections: formattedSections
  };

  return convertedTest;
}

async function main() {
  const result = await convertTest(
    'ssc-cgl',
    '6a0f3ef125f9d428c136a83a',
    'cgl-2025-12-sep-shift-1',
    'ssc-cgl-tier1',
    'ssc'
  );

  console.log('\nConverted Test Summary:');
  console.log(`ID: ${result.id}`);
  console.log(`Title: ${result.title}`);
  console.log(`Total Qs: ${result.totalQuestions}`);
  console.log(`Total Marks: ${result.totalMarks}`);
  console.log(`Sections: ${result.sections.length}`);
  console.log('Sample Q1:');
  console.log(JSON.stringify(result.sections[0].questions[0], null, 2));

  fs.writeFileSync('scripts/sample_converted_cgl_2025.json', JSON.stringify(result, null, 2));
  console.log('Saved sample_converted_cgl_2025.json');
}

main().catch(console.error);
