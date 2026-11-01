import * as cheerio from 'cheerio';

export interface CandidateInfo {
  rollNo?: string;
  candidateName?: string;
  registrationNo?: string;
  category?: string;
  stateZone?: string;
  examDate?: string;
  shiftTime?: string;
  venueName?: string;
  examName?: string;
}

export interface ExtractedOption {
  num: number; // 1, 2, 3, 4
  text: string;
  imageUrl?: string;
  isCorrect: boolean;
  isChosen: boolean;
}

export interface ExtractedQuestion {
  qno: number;
  questionId?: string;
  status: 'correct' | 'wrong' | 'skipped' | 'bonus';
  questionText: string;
  questionImages: string[];
  options: ExtractedOption[];
  chosenOption?: number;
  correctOption?: number;
  sectionName?: string;
}

export interface ExtractedSection {
  name: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  bonus: number;
  rawScore: number;
  negativeMarks: number;
  finalScore: number;
  accuracy: number;
  questions: ExtractedQuestion[];
}

export interface ExamRule {
  marksPerCorrect: number;
  negativePerWrong: number;
  totalQuestionsTarget?: number;
}

export interface ParsedAnswerKey {
  meta: CandidateInfo & {
    examFamily: 'ssc' | 'rrb' | 'other';
    examTitle: string;
    sourceUrl?: string;
  };
  summary: {
    totalQuestions: number;
    attempted: number;
    correct: number;
    wrong: number;
    skipped: number;
    bonus: number;
    rawScore: number;
    negativeMarks: number;
    finalScore: number;
    accuracy: number;
  };
  sections: ExtractedSection[];
  rawQuestionsCount: number;
}

// Backward-compatibility aliases for scoreService
export type UniversalResponseSheet = ParsedAnswerKey;
export type ParsedQuestion = ExtractedQuestion;
export type ParsedSection = ExtractedSection;

/**
 * Normalizes and converts WIRIS/MathML or relative image URLs
 */
function cleanTextAndMath(htmlSnippet: string): string {
  if (!htmlSnippet) return '';
  return htmlSnippet
    .replace(/<img[^>]*data-mathml=["']([^"']+)["'][^>]*>/gi, (_match, mathml) => {
      return `\\( ${decodeEntities(mathml).replace(/<[^>]+>/g, ' ').trim()} \\)`;
    })
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Universal Answer Key Parser for TCS iON, DigiALM, SSC cbexams, and State PSCs
 */
export class UniversalAnswerKeyParser {
  /**
   * Determine the vendor / platform format
   */
  public static detectVendor(html: string): 'digialm' | 'ssc_cbexams' | 'generic' {
    if (
      html.includes('question-pnl') ||
      html.includes('questionRowTbl') ||
      html.includes('questionPnlTbl') ||
      html.includes('menu-tbl') ||
      html.includes('tbl-quesOption') ||
      html.includes('rrb.digialm.com')
    ) {
      return 'digialm';
    }
    if (
      html.includes('lblsubject') ||
      html.includes('ViewCandResponse') ||
      html.includes('Click Here for PART-') ||
      html.includes('Correct Option selected') ||
      html.includes('Wrong Option selected') ||
      /Q\.?\s*No\.?\s*[:.]?/i.test(html)
    ) {
      return 'ssc_cbexams';
    }
    return 'generic';
  }

  /**
   * Extract Candidate Info across any supported layout
   */
  public static extractCandidateInfo($: cheerio.CheerioAPI): CandidateInfo {
    const info: CandidateInfo = {};

    const parsePair = (rawLabel: string, rawVal: string) => {
      const label = rawLabel.trim().toLowerCase();
      const value = rawVal.replace(/^[:\s\u00a0]+/, '').trim();
      if (!value) return;

      if (label.includes('roll') || label.includes('participant id') || label.includes('candidate id')) {
        if (!info.rollNo) info.rollNo = value;
      } else if (label.includes('candidate name') || label.includes('participant name') || label.includes('applicant name')) {
        if (!info.candidateName) info.candidateName = value;
      } else if (label.includes('test date') || label.includes('exam date') || label === 'date') {
        if (!info.examDate) info.examDate = value;
      } else if (label.includes('test time') || label.includes('shift') || label.includes('exam time')) {
        if (!info.shiftTime) info.shiftTime = value;
      } else if (label.includes('test center name') || label.includes('venue') || label.includes('centre') || label.includes('center')) {
        if (!info.venueName) info.venueName = value;
      } else if (label.includes('subject') || label.includes('exam level') || label.includes('exam') || label.includes('post') || label.includes('test name')) {
        if (!info.examName) info.examName = value;
      } else if (label.includes('reg') || label.includes('registration')) {
        if (!info.registrationNo) info.registrationNo = value;
      } else if (label.includes('community') || label.includes('category')) {
        if (!info.category) info.category = value;
      }
    };

    // 1. Check DigiALM / TCS .main-info-pnl or table td cells
    $('table tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length === 2) {
        parsePair($(tds[0]).text(), $(tds[1]).text());
      } else if (tds.length === 3) {
        // Label | : | Value (with possible select dropdown)
        const valTd = $(tds[2]);
        const selVal = valTd.find('option:selected, option').first().text().trim();
        parsePair($(tds[0]).text(), selVal || valTd.text());
      } else if (tds.length >= 4) {
        parsePair($(tds[0]).text(), $(tds[1]).text());
        parsePair($(tds[2]).text(), $(tds[3]).text());
      }
    });

    // 2. Fallback: Selected dropdown option for SSC CBExams
    if (!info.examName) {
      const selectedOpt = $('select option:selected, select option').first().text().trim();
      if (selectedOpt) info.examName = selectedOpt;
    }

    // 3. Fallback regex over raw text if fields are missing
    const pageText = $('body').text() || $.root().text();
    if (!info.rollNo) {
      const m = pageText.match(/Roll\s*No\.?\s*[:\-]?\s*([A-Za-z0-9]+)/i);
      if (m) info.rollNo = m[1].trim();
    }
    if (!info.candidateName) {
      const m = pageText.match(/Candidate\s*Name\s*[:\-]?\s*([A-Za-z\s]+?)(?:\r|\n|Exam|Test|Roll|$)/i);
      if (m && m[1].trim().length > 2) info.candidateName = m[1].trim();
    }
    if (!info.examDate) {
      const m = pageText.match(/(?:Test|Exam)\s*Date\s*[:\-]?\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i);
      if (m) info.examDate = m[1].trim();
    }
    if (!info.shiftTime) {
      const m = pageText.match(/(?:Test\s*Time\s*and\s*Shift|Exam\s*Time|Shift\s*Time)\s*[:\-]?\s*([^\n\r]+)/i);
      if (m) info.shiftTime = m[1].trim();
    }
    if (!info.venueName) {
      const m = pageText.match(/(?:Centre|Center|Venue)\s*Name\s*[:\-]?\s*([^\n\r]+)/i);
      if (m) info.venueName = m[1].trim();
    }
    if (!info.examName) {
      const m = pageText.match(/Exam\s*Level\s*[:\-]?\s*([^\n\r]+)/i);
      if (m) info.examName = m[1].trim();
    }

    return info;
  }

  /**
   * Parse DigiALM / TCS-iON response sheets (SSC, Railways, etc.)
   */
  private static parseDigiALM(
    $: cheerio.CheerioAPI,
    rule: ExamRule,
    baseUrl: string = ''
  ): { sections: ExtractedSection[]; allQuestions: ExtractedQuestion[] } {
    const allQuestions: ExtractedQuestion[] = [];
    const sectionMap = new Map<string, ExtractedQuestion[]>();

    const parseSinglePanel = (pnl: cheerio.Cheerio<any>, qno: number, secName: string): ExtractedQuestion => {
      let questionId = '';
      let chosenOptNum: number | undefined = undefined;

      // Extract Question ID and Chosen Option from status table (.menu-tbl)
      pnl.find('.menu-tbl tr').each((_, tr) => {
        const tds = $(tr).find('td');
        if (tds.length >= 2) {
          const key = $(tds[0]).text().trim().toLowerCase();
          const val = $(tds[1]).text().trim();

          if (key.includes('question id')) {
            questionId = val;
          } else if (key.includes('chosen option')) {
            const parsedNum = parseInt(val, 10);
            if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 4) {
              chosenOptNum = parsedNum;
            }
          } else if (key.includes('status') && (val.toLowerCase().includes('not answered') || val === '--')) {
            // Keep chosenOptNum undefined
          }
        }
      });

      // Extract Question Text & Images
      let quesText = '';
      const questionImages: string[] = [];

      // Check .questionRowTbl (used in RRB 2024/2025 and newer TCS iON formats)
      const qRowTbl = pnl.find('.questionRowTbl');
      const tblQuesOption = pnl.find('.tbl-quesOption');

      const options: ExtractedOption[] = [];
      let correctOptNum: number | undefined = undefined;

      if (qRowTbl.length > 0) {
        qRowTbl.find('tr').each((_, tr) => {
          const row = $(tr);
          const tds = row.find('td');
          const text = row.text().trim();

          // Question row has Q.1 / Q.2 in first td
          if (tds.length >= 2 && /^Q\.\d+/i.test($(tds[0]).text().trim())) {
            quesText = cleanTextAndMath($(tds[1]).text().trim());
            $(tds[1]).find('img').each((_, img) => {
              const src = $(img).attr('src');
              if (src && !src.includes('tick') && !src.includes('cross')) {
                const absSrc = src.startsWith('http') ? src : (baseUrl ? new URL(src, baseUrl).toString() : src);
                questionImages.push(absSrc);
              }
            });
          }

          // Option row
          const isRight = row.hasClass('rightAns') || row.find('.rightAns').length > 0 || row.html()?.includes('tick.png');
          const isOptionRow = row.hasClass('rightAns') || row.hasClass('wrngAns') || row.find('.rightAns, .wrngAns').length > 0 || row.find('img.tick').length > 0 || /^(?:Ans\s*)?[1-4]\./.test(text);

          if (isOptionRow) {
            const optMatch = text.match(/^(?:Ans\s*)?([1-4])\.\s*([\s\S]*)$/);
            const num = optMatch ? parseInt(optMatch[1], 10) : (options.length + 1);
            const rawOptText = optMatch ? optMatch[2] : text;

            if (isRight) correctOptNum = num;

            let optImg: string | undefined = undefined;
            row.find('img').each((_, img) => {
              const src = $(img).attr('src');
              if (src && !src.includes('tick') && !src.includes('cross')) {
                optImg = src.startsWith('http') ? src : (baseUrl ? new URL(src, baseUrl).toString() : src);
              }
            });

            options.push({
              num,
              text: cleanTextAndMath(rawOptText),
              imageUrl: optImg,
              isCorrect: Boolean(isRight),
              isChosen: chosenOptNum === num
            });
          }
        });
      } else if (tblQuesOption.length > 0) {
        // Standard DigiALM .tbl-quesOption format
        const quesRow = tblQuesOption.find('tr').first();
        quesText = cleanTextAndMath(quesRow.find('td').last().text() || pnl.find('.bold').first().text());

        tblQuesOption.find('tr').slice(1).each((optIdx, optRow) => {
          const row = $(optRow);
          const optNum = optIdx + 1;
          const optText = cleanTextAndMath(row.find('td').last().text());
          const isCorrect = row.hasClass('rightAns') || row.find('.rightAns').length > 0 || row.html()?.includes('tick.png');

          if (isCorrect) correctOptNum = optNum;

          let optImg: string | undefined = undefined;
          row.find('img').each((_, img) => {
            const src = $(img).attr('src');
            if (src && !src.includes('tick') && !src.includes('cross')) {
              optImg = src.startsWith('http') ? src : (baseUrl ? new URL(src, baseUrl).toString() : src);
            }
          });

          options.push({
            num: optNum,
            text: optText,
            imageUrl: optImg,
            isCorrect: Boolean(isCorrect),
            isChosen: chosenOptNum === optNum
          });
        });
      } else {
        // Generic fallback for question and options inside pnl
        quesText = cleanTextAndMath(pnl.find('.bold').first().text() || `Question ${qno}`);
      }

      // Collect question images from panel if not yet found
      if (questionImages.length === 0) {
        pnl.find('img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && !src.includes('tick.png') && !src.includes('cross.png') && !src.includes('dot.png')) {
            const absSrc = src.startsWith('http') ? src : (baseUrl ? new URL(src, baseUrl).toString() : src);
            if (!questionImages.includes(absSrc)) questionImages.push(absSrc);
          }
        });
      }

      // Determine Question Status
      let status: 'correct' | 'wrong' | 'skipped' | 'bonus' = 'skipped';
      const isDropped = pnl.text().toLowerCase().includes('dropped') || pnl.text().toLowerCase().includes('benefit to all');

      if (isDropped) {
        status = 'bonus';
      } else if (!chosenOptNum) {
        status = 'skipped';
      } else if (chosenOptNum === correctOptNum) {
        status = 'correct';
      } else {
        status = 'wrong';
      }

      return {
        qno,
        questionId: questionId || `Q${qno}`,
        status,
        questionText: quesText || `Question ${qno}`,
        questionImages,
        options,
        chosenOption: chosenOptNum,
        correctOption: correctOptNum,
        sectionName: secName
      };
    };

    // Iterate by section containers if present
    const secContainers = $('.section-cntnr');
    if (secContainers.length > 0) {
      let counter = 1;
      secContainers.each((sIdx, secEl) => {
        const rawSecName = $(secEl).find('.section-lbl').first().text().trim() || `Section ${sIdx + 1}`;
        const secName = rawSecName.replace(/Section\s*:\s*/i, '').replace(/Part\s*[-:]?/i, '').trim();

        const secQuestions: ExtractedQuestion[] = [];
        $(secEl).find('.question-pnl').each((_, pnlEl) => {
          const q = parseSinglePanel($(pnlEl), counter++, secName);
          allQuestions.push(q);
          secQuestions.push(q);
        });

        if (!sectionMap.has(secName)) {
          sectionMap.set(secName, []);
        }
        sectionMap.get(secName)!.push(...secQuestions);
      });
    } else {
      // Fallback: iterate all .question-pnl directly
      const questionPnls = $('.question-pnl');
      questionPnls.each((idx, el) => {
        const pnl = $(el);
        const qno = idx + 1;
        const secHeader = pnl.closest('.section-cntnr').find('.section-lbl, .bold').first().text().trim() ||
                          pnl.prevAll('.section-lbl').first().text().trim();
        const secName = secHeader ? secHeader.replace(/Section\s*:\s*/i, '').replace(/Part\s*[-:]?/i, '').trim() : 'General Section';

        const q = parseSinglePanel(pnl, qno, secName);
        allQuestions.push(q);
        if (!sectionMap.has(secName)) {
          sectionMap.set(secName, []);
        }
        sectionMap.get(secName)!.push(q);
      });
    }

    // Build structured sections
    const sections: ExtractedSection[] = [];
    sectionMap.forEach((questions, name) => {
      const correct = questions.filter(q => q.status === 'correct').length;
      const wrong = questions.filter(q => q.status === 'wrong').length;
      const skipped = questions.filter(q => q.status === 'skipped').length;
      const bonus = questions.filter(q => q.status === 'bonus').length;
      const attempted = correct + wrong;

      const rawScore = (correct + bonus) * rule.marksPerCorrect;
      const negativeMarks = wrong * rule.negativePerWrong;
      const finalScore = parseFloat(Math.max(0, rawScore - negativeMarks).toFixed(2));
      const accuracy = attempted > 0 ? parseFloat(((correct / attempted) * 100).toFixed(1)) : 0;

      sections.push({
        name,
        totalQuestions: questions.length,
        attempted,
        correct,
        wrong,
        skipped,
        bonus,
        rawScore: parseFloat(rawScore.toFixed(2)),
        negativeMarks: parseFloat(negativeMarks.toFixed(2)),
        finalScore,
        accuracy,
        questions
      });
    });

    return { sections, allQuestions };
  }

  /**
   * Parse SSC CBExams format (ViewCandResponse*.aspx) and modern SSC Challenge Sheets
   */
  private static parseSSCCBExams(
    $: cheerio.CheerioAPI,
    rule: ExamRule,
    baseUrl: string = ''
  ): { sections: ExtractedSection[]; allQuestions: ExtractedQuestion[] } {
    const allQuestions: ExtractedQuestion[] = [];

    // Helper to detect color from attributes/styles/classes
    const detectColor = (el: cheerio.Cheerio<any>): 'green' | 'red' | 'yellow' | 'none' => {
      const bg = (el.attr('bgcolor') || '').toLowerCase();
      const style = (el.attr('style') || '').toLowerCase();
      const cls = (el.attr('class') || '').toLowerCase();
      const h = el.html() || '';

      if (
        bg.includes('green') || bg.includes('#008000') || bg.includes('#00a651') || bg.includes('rgb(0, 128, 0)') ||
        style.includes('green') || style.includes('#008000') || style.includes('#00a651') || style.includes('rgb(0, 128, 0)') ||
        cls.includes('green') || h.includes('tick.png') || h.includes('green.png')
      ) return 'green';

      if (
        bg.includes('red') || bg.includes('#ff0000') || bg.includes('#ed1c24') || bg.includes('rgb(255, 0, 0)') ||
        style.includes('red') || style.includes('#ff0000') || style.includes('#ed1c24') || style.includes('rgb(255, 0, 0)') ||
        cls.includes('red') || h.includes('cross.png') || h.includes('red.png')
      ) return 'red';

      if (
        bg.includes('yellow') || bg.includes('#ffff00') || bg.includes('#ffde00') || bg.includes('rgb(255, 255, 0)') ||
        style.includes('yellow') || style.includes('#ffff00') || style.includes('#ffde00') || style.includes('rgb(255, 255, 0)') ||
        cls.includes('yellow') || h.includes('yellow.png')
      ) return 'yellow';

      return 'none';
    };

    // Detect section titles in the document
    const sectionNamesMap: { [key: string]: string } = {
      A: 'PART-A (General Intelligence and Reasoning)',
      B: 'PART-B (General Awareness)',
      C: 'PART-C (Quantitative Aptitude (Basic Arithmetic Skill))',
      D: 'PART-D (English Language (Basic Knowledge))'
    };

    // Scan for actual headers in the HTML
    $('b, strong, h2, h3, h4, span, div').each((_, el) => {
      const t = $(el).text().trim();
      const m = t.match(/^PART\s*[-:]?\s*([A-D])\s*(?:\(([^)]+)\)|[^\n\r]*)/i);
      if (m) {
        const letter = m[1].toUpperCase();
        sectionNamesMap[letter] = t;
      }
    });

    // Helper to get section name for question number
    const getSectionForQno = (qno: number): string => {
      if (qno <= 25) return sectionNamesMap['A'];
      if (qno <= 50) return sectionNamesMap['B'];
      if (qno <= 75) return sectionNamesMap['C'];
      return sectionNamesMap['D'];
    };

    // Strategy 1: Table-based question parsing (Standard SSC CBExams)
    const seenQnos = new Set<number>();

    $('table').each((_, tbl) => {
      const tableEl = $(tbl);
      const tableText = tableEl.text();
      const match = tableText.match(/Q\.?\s*No\.?\s*[:.]?\s*(\d+)/i);
      if (!match) return;

      const qno = parseInt(match[1], 10);
      if (seenQnos.has(qno)) return;
      seenQnos.add(qno);

      const rows = tableEl.find('tr');
      const options: ExtractedOption[] = [];
      let correctOptNum: number | undefined;
      let chosenOptNum: number | undefined;
      let quesText = '';
      const questionImages: string[] = [];

      rows.each((_, tr) => {
        const row = $(tr);
        const rowText = row.text().trim();
        if (/Q\.?\s*No\.?\s*[:.]?\s*\d+/i.test(rowText)) {
          quesText = cleanTextAndMath(rowText.replace(/Q\.?\s*No\.?\s*[:.]?\s*\d+/i, '').replace(/^[:\s]+/, ''));
          row.find('img').each((__, img) => {
            const src = $(img).attr('src');
            if (src && !src.includes('tick') && !src.includes('cross') && !src.includes('dot')) {
              questionImages.push(src.startsWith('http') ? src : (baseUrl ? new URL(src, baseUrl).toString() : src));
            }
          });
          return;
        }
        if (rowText.toLowerCase() === 'not answered') return;

        let color = 'none';
        row.find('td, div, span').each((__, cell) => {
          const c = detectColor($(cell));
          if (c !== 'none') color = c;
        });
        if (color === 'none') color = detectColor(row);

        const optNum = options.length + 1;
        let optImg: string | undefined;
        row.find('img').each((__, img) => {
          const src = $(img).attr('src');
          if (src && !src.includes('tick') && !src.includes('cross') && !src.includes('dot')) {
            optImg = src.startsWith('http') ? src : (baseUrl ? new URL(src, baseUrl).toString() : src);
          }
        });

        if (color === 'green') {
          correctOptNum = optNum;
          chosenOptNum = optNum;
        } else if (color === 'red') {
          chosenOptNum = optNum;
        } else if (color === 'yellow') {
          correctOptNum = optNum;
        }

        options.push({
          num: optNum,
          text: cleanTextAndMath(rowText),
          imageUrl: optImg,
          isCorrect: color === 'green' || color === 'yellow',
          isChosen: color === 'green' || color === 'red'
        });
      });

      let status: 'correct' | 'wrong' | 'skipped' | 'bonus' = 'skipped';
      if (tableText.includes('dropped') || tableText.includes('taken up for challenge')) {
        status = 'bonus';
      } else if (chosenOptNum && correctOptNum && chosenOptNum === correctOptNum) {
        status = 'correct';
      } else if (chosenOptNum) {
        status = 'wrong';
      } else {
        status = 'skipped';
      }

      const secName = getSectionForQno(qno);

      allQuestions.push({
        qno,
        questionId: `SSC_Q${qno}`,
        status,
        questionText: quesText || `Question ${qno}`,
        questionImages,
        options,
        chosenOption: chosenOptNum,
        correctOption: correctOptNum,
        sectionName: secName
      });
    });

    // Strategy 2: Fallback regex slice if table parsing caught fewer than 10 questions
    if (allQuestions.length < 10) {
      allQuestions.length = 0; // Clear
      seenQnos.clear();

      const html = $.html();
      const qMatches = [...html.matchAll(/Q\.?\s*No\.?\s*[:.]?\s*(?:&nbsp;|\s*)(\d+)/gi)];

      qMatches.forEach((match, idx) => {
        const qno = parseInt(match[1], 10);
        if (seenQnos.has(qno)) return;
        seenQnos.add(qno);

        const start = match.index || 0;
        const end = idx + 1 < qMatches.length ? (qMatches[idx + 1].index || html.length) : html.length;
        const blockHtml = html.substring(start, end);
        const $block = cheerio.load(blockHtml.includes('<table') ? blockHtml : `<table>${blockHtml}</table>`);

        const options: ExtractedOption[] = [];
        let correctOptNum: number | undefined;
        let chosenOptNum: number | undefined;

        $block('tr').each((_, tr) => {
          const row = $block(tr);
          const rowText = row.text().trim();
          if (/Q\.?\s*No\.?\s*[:.]?\s*\d+/i.test(rowText) || rowText.toLowerCase() === 'not answered') return;

          let color = 'none';
          row.find('td, div, span').each((__, cell) => {
            const c = detectColor($block(cell));
            if (c !== 'none') color = c;
          });
          if (color === 'none') color = detectColor(row);

          const optNum = options.length + 1;
          if (color === 'green') {
            correctOptNum = optNum;
            chosenOptNum = optNum;
          } else if (color === 'red') {
            chosenOptNum = optNum;
          } else if (color === 'yellow') {
            correctOptNum = optNum;
          }

          options.push({
            num: optNum,
            text: cleanTextAndMath(rowText),
            isCorrect: color === 'green' || color === 'yellow',
            isChosen: color === 'green' || color === 'red'
          });
        });

        let status: 'correct' | 'wrong' | 'skipped' | 'bonus' = 'skipped';
        if (blockHtml.includes('dropped') || blockHtml.includes('taken up for challenge')) {
          status = 'bonus';
        } else if (chosenOptNum && correctOptNum && chosenOptNum === correctOptNum) {
          status = 'correct';
        } else if (chosenOptNum) {
          status = 'wrong';
        } else {
          status = 'skipped';
        }

        allQuestions.push({
          qno,
          questionId: `SSC_Q${qno}`,
          status,
          questionText: cleanTextAndMath($block.text().substring(0, 140)) || `Question ${qno}`,
          questionImages: [],
          options,
          chosenOption: chosenOptNum,
          correctOption: correctOptNum,
          sectionName: getSectionForQno(qno)
        });
      });
    }

    // Sort questions by question number
    allQuestions.sort((a, b) => a.qno - b.qno);

    // Group into sections
    const grouped = new Map<string, ExtractedQuestion[]>();
    allQuestions.forEach(q => {
      const name = q.sectionName || 'General Section';
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(q);
    });

    const sections: ExtractedSection[] = [];
    grouped.forEach((questions, name) => {
      const correct = questions.filter(q => q.status === 'correct').length;
      const wrong = questions.filter(q => q.status === 'wrong').length;
      const skipped = questions.filter(q => q.status === 'skipped').length;
      const bonus = questions.filter(q => q.status === 'bonus').length;
      const attempted = correct + wrong;

      const rawScore = (correct + bonus) * rule.marksPerCorrect;
      const negativeMarks = wrong * rule.negativePerWrong;
      const finalScore = parseFloat(Math.max(0, rawScore - negativeMarks).toFixed(2));
      const accuracy = attempted > 0 ? parseFloat(((correct / attempted) * 100).toFixed(1)) : 0;

      sections.push({
        name,
        totalQuestions: questions.length,
        attempted,
        correct,
        wrong,
        skipped,
        bonus,
        rawScore: parseFloat(rawScore.toFixed(2)),
        negativeMarks: parseFloat(negativeMarks.toFixed(2)),
        finalScore,
        accuracy,
        questions
      });
    });

    return { sections, allQuestions };
  }

  /**
   * Main evaluate function
   */
  public static parse(
    html: string,
    options: {
      examFamily?: 'ssc' | 'rrb' | 'other';
      examTitle?: string;
      category?: string;
      zone?: string;
      customRule?: ExamRule;
      sourceUrl?: string;
    } = {}
  ): ParsedAnswerKey {
    const $ = cheerio.load(html);
    const vendor = this.detectVendor(html);

    // Extract Candidate Info first to infer exam
    const candidateInfo = this.extractCandidateInfo($);
    if (options.category) candidateInfo.category = options.category;
    if (options.zone) candidateInfo.stateZone = options.zone;

    // Detect family: from option, or URL, or candidate examName
    let family = options.examFamily;
    if (!family) {
      const examNameLow = (candidateInfo.examName || '').toLowerCase();
      const urlLow = (options.sourceUrl || '').toLowerCase();
      if (examNameLow.includes('rrb') || examNameLow.includes('railway') || examNameLow.includes('ntpc') || examNameLow.includes('alp') || urlLow.includes('rrb')) {
        family = 'rrb';
      } else if (examNameLow.includes('ssc') || examNameLow.includes('cgl') || examNameLow.includes('chsl') || examNameLow.includes('mts') || urlLow.includes('ssc') || vendor === 'ssc_cbexams') {
        family = 'ssc';
      } else {
        family = 'rrb';
      }
    }

    const defaultRule: ExamRule = family === 'ssc'
      ? { marksPerCorrect: 2.0, negativePerWrong: 0.5 }
      : { marksPerCorrect: 1.0, negativePerWrong: (1 / 3) };

    const rule = options.customRule || defaultRule;

    // Parse questions & sections
    const { sections, allQuestions } = vendor === 'ssc_cbexams'
      ? this.parseSSCCBExams($, rule, options.sourceUrl)
      : this.parseDigiALM($, rule, options.sourceUrl);

    // Total Summary calculation
    const totalQuestions = allQuestions.length;
    const correct = allQuestions.filter(q => q.status === 'correct').length;
    const wrong = allQuestions.filter(q => q.status === 'wrong').length;
    const skipped = allQuestions.filter(q => q.status === 'skipped').length;
    const bonus = allQuestions.filter(q => q.status === 'bonus').length;
    const attempted = correct + wrong;

    const rawScore = (correct + bonus) * rule.marksPerCorrect;
    const negativeMarks = wrong * rule.negativePerWrong;
    const finalScore = parseFloat(Math.max(0, rawScore - negativeMarks).toFixed(2));
    const accuracy = attempted > 0 ? parseFloat(((correct / attempted) * 100).toFixed(1)) : 0;

    return {
      meta: {
        ...candidateInfo,
        examFamily: family,
        examTitle: options.examTitle || candidateInfo.examName || (family === 'ssc' ? 'SSC CGL / CHSL' : 'RRB NTPC'),
        sourceUrl: options.sourceUrl
      },
      summary: {
        totalQuestions,
        attempted,
        correct,
        wrong,
        skipped,
        bonus,
        rawScore: parseFloat(rawScore.toFixed(2)),
        negativeMarks: parseFloat(negativeMarks.toFixed(2)),
        finalScore,
        accuracy
      },
      sections,
      rawQuestionsCount: totalQuestions
    };
  }
}

/**
 * Top-level helper function exported for evaluateAnswerKey
 */
export function parseResponseSheet(
  html: string,
  sourceUrl?: string,
  options?: {
    examFamily?: 'ssc' | 'rrb' | 'other';
    examTitle?: string;
    category?: string;
    zone?: string;
    customRule?: ExamRule;
  }
): ParsedAnswerKey {
  return UniversalAnswerKeyParser.parse(html, { ...options, sourceUrl });
}
