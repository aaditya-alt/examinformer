const { fetchTestRaw, extractTestAndAnswersFromHtml, cleanHtmlToKaTeX, formatDisplayTitle } = require('./pipeline_utils');

async function testSingle() {
  const seriesSlug = 'ssc-cgl';
  const testId = '6a0f3ef125f9d428c136a83a';
  console.log('Fetching test...');
  const html = await fetchTestRaw(seriesSlug, testId);
  const { testData, answersData, resolveValue } = extractTestAndAnswersFromHtml(html);

  console.log('Sections:', testData.sections.length);
  let totalQuestions = 0;
  let dollarIssues = 0;

  testData.sections.forEach(sec => {
    sec.questions.forEach(q => {
      totalQuestions++;
      const ans = answersData[q._id];
      let rawSolEn = ans?.sol?.en?.value || '';
      let resolvedSolEn = resolveValue(rawSolEn);
      let cleaned = cleanHtmlToKaTeX(resolvedSolEn);
      if (cleaned.match(/^\$[0-9a-f]{2,4}$/i)) {
        dollarIssues++;
      }
    });
  });

  console.log(`Total questions: ${totalQuestions}, Dollar issues remaining: ${dollarIssues}`);
}

testSingle().catch(console.error);
