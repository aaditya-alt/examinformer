const fs = require('fs');

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripHtml(html) {
  if (!html) return '';
  return decodeHtmlEntities(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function parseExtractedQuestions() {
  const html = fs.readFileSync('scripts/solution_authed.html', 'utf8');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];

  // Find the large script containing testData and answersData
  let targetContent = null;
  for (const s of scripts) {
    if (s.includes('"testData":') && s.includes('"answersData":')) {
      const prefix = '<script>self.__next_f.push([1,"';
      const start = s.indexOf(prefix);
      const end = s.lastIndexOf('"])</script>');
      const content = s.substring(start + prefix.length, end);
      targetContent = JSON.parse(`"${content}"`);
      break;
    }
  }

  if (!targetContent) {
    console.error('Target script not found');
    return;
  }

  // Parse JSON chunks
  // Extract testData
  const testDataMatch = targetContent.match(/"testData":(\{.*?"languages":\[.*?\]\})/);
  const answersDataMatch = targetContent.match(/"answersData":(\{.*?\})\,"responsesData"/);

  let testData, answersData;
  try {
    testData = JSON.parse(testDataMatch[1]);
    answersData = JSON.parse(answersDataMatch[1]);
  } catch (e) {
    console.log('Regex parse error:', e.message);
    // Alternative: find index
    const tdStart = targetContent.indexOf('"testData":') + 11;
    const adStart = targetContent.indexOf('"answersData":') + 14;
    const rdStart = targetContent.indexOf(',"responsesData":');
    
    const adStr = targetContent.slice(adStart, rdStart);
    answersData = JSON.parse(adStr);
    console.log('Successfully parsed answersData, keys:', Object.keys(answersData).length);

    // Let's parse testData
    const tdStr = targetContent.slice(tdStart, targetContent.indexOf(',"answersData":'));
    testData = JSON.parse(tdStr);
    console.log('Successfully parsed testData, title:', testData.title, 'sections:', testData.sections.length);
  }

  console.log(`\nTitle: "${testData.title}"`);
  console.log(`Total Sections: ${testData.sections.length}`);
  
  let totalQ = 0;
  testData.sections.forEach((sec, sIdx) => {
    console.log(`Section ${sIdx + 1}: ${sec.title} (${sec.questions.length} Qs)`);
    totalQ += sec.questions.length;
    
    // Sample Question 1 of section
    const q1 = sec.questions[0];
    const ans1 = answersData[q1._id];
    console.log(`  Sample Q1: "${stripHtml(q1.en.value).slice(0, 70)}..."`);
    console.log(`  Options:`, q1.en.options.map(o => `${o.prompt}: ${stripHtml(o.value)}`));
    console.log(`  Correct Option: ${ans1?.correctOption}`);
    console.log(`  Solution: "${stripHtml(ans1?.sol?.en?.value).slice(0, 90)}..."`);
  });
  console.log(`Total questions in test: ${totalQ}`);
}

parseExtractedQuestions().catch(console.error);
