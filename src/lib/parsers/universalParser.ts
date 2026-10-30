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

/**
 * Normalizes and converts WIRIS/MathML or relative image URLs
 */
function cleanTextAndMath(htmlSnippet: string): string {
  if (!htmlSnippet) return '';
  return htmlSnippet
    .replace(/<img[^>]*data-mathml=["']([^"']+)["'][^>]*>/gi, (_match, mathml) => {
      // Decode MathML entity text or replace with readable math formula
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
    if (html.includes('question-pnl') || html.includes('menu-tbl') || html.includes('tbl-quesOption')) {
      return 'digialm';
    }
    if (html.includes('lblsubject') || html.includes('ViewCandResponse') || html.includes('Q.No:&nbsp;')) {
      return 'ssc_cbexams';
    }
    return 'generic';
  }

  /**
   * Extract Candidate Info across any supported layout
   */
  public static extractCandidateInfo($: cheerio.CheerioAPI): CandidateInfo {
    const info: CandidateInfo = {};

    // 1. Check DigiALM / TCS .main-info-pnl or table td cells
    $('table tr').each((_, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 2) {
        const label = $(tds[0]).text().trim().toLowerCase();
        const value = $(tds[1]).text().replace(/^[:\s\u00a0]+/, '').trim();

        if (!value) return;

        if (label.includes('roll') || label.includes('participant id') || label.includes('candidate id')) {
          if (!info.rollNo) info.rollNo = value;
        } else if (label.includes('candidate name') || label.includes('participant name') || label.includes('applicant name')) {
          if (!info.candidateName) info.candidateName = value;
        } else if (label.includes('test date') || label.includes('exam date') || label.includes('date')) {
          if (!info.examDate) info.examDate = value;
        } else if (label.includes('test time') || label.includes('shift') || label.includes('exam time')) {
          if (!info.shiftTime) info.shiftTime = value;
        } else if (label.includes('venue') || label.includes('centre') || label.includes('center')) {
          if (!info.venueName) info.venueName = value;
        } else if (label.includes('subject') || label.includes('exam') || label.includes('post') || label.includes('test name')) {
          if (!info.examName) info.examName = value;
        } else if (label.includes('reg') || label.includes('registration')) {
          if (!info.registrationNo) info.registrationNo = value;
        }
      }
    });

    // Fallback: Selected dropdown option for SSC CBExams
    if (!info.examName) {
      const selectedOpt = $('option[selected]').first().text().trim();
      if (selectedOpt) info.examName = selectedOpt;
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

    const questionPnls = $('.question-pnl');

    questionPnls.each((idx, el) => {
      const pnl = $(el);
      const qno = idx + 1;

      // Extract Question ID and Chosen Option from status table (.menu-tbl)
      let questionId = '';
      let chosenOptNum: number | undefined = undefined;
      const optionIdMap = new Map<string, number>();

      pnl.find('.menu-tbl tr').each((_, tr) => {
        const text = $(tr).text();
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
          } else if (key.includes('option') && key.includes('id')) {
            const numMatch = key.match(/\d+/);
            if (numMatch) {
              optionIdMap.set(val, parseInt(numMatch[0], 10));
            }
          }
        }
      });

      // Extract Section Name if present
      let sectionName = 'General Section';
      const secHeader = pnl.closest('.section-cntnr').find('.section-lbl, .bold').first().text().trim() ||
                        pnl.prevAll('.section-lbl').first().text().trim();
      if (secHeader) {
        sectionName = secHeader.replace(/Part\s*[-:]?/i, '').trim();
      }

      // Extract Question Text & Images
      const quesRow = pnl.find('.tbl-quesOption tr').first();
      const quesText = cleanTextAndMath(quesRow.find('td').last().text() || pnl.find('.bold').first().text());
      const questionImages: string[] = [];
      pnl.find('img').each((_, img) => {
        const src = $(img).attr('src');
        if (src && !src.includes('tick.png') && !src.includes('cross.png') && !src.includes('dot.png')) {
          const absSrc = src.startsWith('http') ? src : (baseUrl ? new URL(src, baseUrl).toString() : src);
          questionImages.push(absSrc);
        }
      });

      // Extract Options & Find Correct Option
      const options: ExtractedOption[] = [];
      let correctOptNum: number | undefined = undefined;

      const optionRows = pnl.find('.tbl-quesOption tr').slice(1);
      optionRows.each((optIdx, optRow) => {
        const row = $(optRow);
        const optNum = optIdx + 1;
        const optText = cleanTextAndMath(row.find('td').last().text());
        const hasRightAnsClass = row.hasClass('rightAns') || row.find('.rightAns').length > 0;
        const hasTickImg = row.find('img[src*="tick"]').length > 0;

        const isCorrect = hasRightAnsClass || hasTickImg;
        if (isCorrect) {
          correctOptNum = optNum;
        }

        const optImg = row.find('img').first().attr('src');
        const absOptImg = optImg && !optImg.includes('tick') ? (optImg.startsWith('http') ? optImg : (baseUrl ? new URL(optImg, baseUrl).toString() : optImg)) : undefined;

        options.push({
          num: optNum,
          text: optText,
          imageUrl: absOptImg,
          isCorrect,
          isChosen: chosenOptNum === optNum
        });
      });

      // Determine Question Status
      let status: 'correct' | 'wrong' | 'skipped' | 'bonus' = 'skipped';
      const isDropped = pnl.text().toLowerCase().includes('dropped') || correctOptNum === undefined;

      if (isDropped) {
        status = 'bonus';
      } else if (!chosenOptNum) {
        status = 'skipped';
      } else if (chosenOptNum === correctOptNum) {
        status = 'correct';
      } else {
        status = 'wrong';
      }

      const qItem: ExtractedQuestion = {
        qno,
        questionId: questionId || `Q${qno}`,
        status,
        questionText: quesText || `Question ${qno}`,
        questionImages,
        options,
        chosenOption: chosenOptNum,
        correctOption: correctOptNum,
        sectionName
      };

      allQuestions.push(qItem);

      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
      }
      sectionMap.get(sectionName)!.push(qItem);
    });

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
        rawScore,
        negativeMarks,
        finalScore,
        accuracy,
        questions
      });
    });

    return { sections, allQuestions };
  }

  /**
   * Parse SSC CBExams format (ViewCandResponse*.aspx)
   */
  private static parseSSCCBExams(
    $: cheerio.CheerioAPI,
    rule: ExamRule,
    baseUrl: string = ''
  ): { sections: ExtractedSection[]; allQuestions: ExtractedQuestion[] } {
    const allQuestions: ExtractedQuestion[] = [];
    const sections: ExtractedSection[] = [];

    // Sections identified by lblsubject or Part headers
    const sectionElements = $('span#lblsubject');
    const partNames: string[] = [];

    if (sectionElements.length > 0) {
      sectionElements.each((_, el) => {
        const title = $(el).text().trim();
        if (title) partNames.push(title);
      });
    }

    if (partNames.length === 0) {
      partNames.push('Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension');
    }

    // Split HTML by Q.No:
    const html = $.html();
    const qMatches = [...html.matchAll(/Q\.No:&nbsp;(\d+)/gi)];

    qMatches.forEach((match, idx) => {
      const qno = parseInt(match[1], 10);
      const start = match.index || 0;
      const end = idx + 1 < qMatches.length ? (qMatches[idx + 1].index || html.length) : html.length;
      const blockHtml = html.substring(start, end);
      const $block = cheerio.load(blockHtml);

      // Check option table rows and bgcolor
      const options: ExtractedOption[] = [];
      let correctOptNum: number | undefined = undefined;
      let chosenOptNum: number | undefined = undefined;
      let status: 'correct' | 'wrong' | 'skipped' | 'bonus' = 'skipped';

      $block('tr').each((rowIdx, tr) => {
        const bg = $block(tr).find('td[bgcolor]').attr('bgcolor')?.toLowerCase();
        if (bg) {
          const optIndex = options.length + 1;
          const optText = $block(tr).text().trim();
          const isGreen = bg.includes('green') || bg.includes('#008000');
          const isRed = bg.includes('red') || bg.includes('#ff0000');
          const isYellow = bg.includes('yellow') || bg.includes('#ffff00');

          if (isGreen) {
            correctOptNum = optIndex;
            chosenOptNum = optIndex;
            status = 'correct';
          } else if (isRed) {
            chosenOptNum = optIndex;
            status = 'wrong';
          } else if (isYellow) {
            correctOptNum = optIndex;
          }

          options.push({
            num: optIndex,
            text: optText,
            isCorrect: isGreen || isYellow,
            isChosen: isGreen || isRed
          });
        }
      });

      if (blockHtml.includes('taken up for challenge') || blockHtml.includes('purple')) {
        status = 'bonus';
      }

      // Assign to section based on question number distribution
      const secIdx = Math.min(Math.floor((qno - 1) / 25), partNames.length - 1);
      const sectionName = partNames[secIdx] || `Section ${secIdx + 1}`;

      const qItem: ExtractedQuestion = {
        qno,
        questionId: `SSC_Q${qno}`,
        status,
        questionText: cleanTextAndMath($block.text().substring(0, 120)) || `Question ${qno}`,
        questionImages: [],
        options,
        chosenOption: chosenOptNum,
        correctOption: correctOptNum,
        sectionName
      };

      allQuestions.push(qItem);
    });

    // Group into sections
    const grouped = new Map<string, ExtractedQuestion[]>();
    allQuestions.forEach(q => {
      const name = q.sectionName || 'General Section';
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(q);
    });

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
        rawScore,
        negativeMarks,
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

    // Default rule based on detected or passed family
    const family = options.examFamily || (vendor === 'ssc_cbexams' ? 'ssc' : 'rrb');
    const defaultRule: ExamRule = family === 'ssc'
      ? { marksPerCorrect: 2.0, negativePerWrong: 0.5 }
      : { marksPerCorrect: 1.0, negativePerWrong: 0.333 };

    const rule = options.customRule || defaultRule;

    // Extract Candidate Info
    const candidateInfo = this.extractCandidateInfo($);
    if (options.category) candidateInfo.category = options.category;
    if (options.zone) candidateInfo.stateZone = options.zone;

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
        examTitle: options.examTitle || candidateInfo.examName || (family === 'ssc' ? 'SSC CGL / CHSL' : 'RRB NTPC')
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
