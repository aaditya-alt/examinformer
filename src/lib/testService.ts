import fs from 'fs';
import path from 'path';
import testsCatalog from '@/data/tests-catalog.json';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { CBTTest, CBTSection, CBTQuestion } from './types/cbt';
import {
  EXAM_REGISTRY,
  CHAPTER_TAXONOMY,
  generateChapterTest,
  generateSectionalTest,
  generateSmartFullMock
} from './questionBank';

import { testsStore, registerNewTest, deleteTest } from './testStore';

export * from './types/cbt';
export { testsStore, registerNewTest, deleteTest };

export function getStandardSections(examCode?: string, title?: string): CBTSection[] {
  const code = (examCode || '').toLowerCase();
  const t = (title || '').toLowerCase();
  const isSSC = code.includes('ssc') || t.includes('ssc');
  const isRailway = code.includes('rrb') || t.includes('rrb') || t.includes('railway') || t.includes('alp') || t.includes('group d') || t.includes('ntpc');
  const isTier2 = code.includes('tier2') || code.includes('tier-2') || t.includes('tier 2') || t.includes('tier-2') || t.includes('tier ii');

  if (isSSC && isTier2) {
    const isCHSL = code.includes('chsl') || t.includes('chsl');
    return [
      { id: 'sec_1', name: 'Mathematical Abilities', questions: [] },
      { id: 'sec_2', name: 'Reasoning and General Intelligence', questions: [] },
      { id: 'sec_3', name: 'English Language and Comprehension', questions: [] },
      { id: 'sec_4', name: 'General Awareness', questions: [] },
      { id: 'sec_5', name: 'Computer Knowledge', questions: [] }
    ];
  }

  if (isRailway) {
    if (code.includes('alp') || t.includes('alp')) {
      return [
        { id: 'sec_1', name: 'Mathematics', questions: [] },
        { id: 'sec_2', name: 'General Intelligence & Reasoning', questions: [] },
        { id: 'sec_3', name: 'General Science', questions: [] },
        { id: 'sec_4', name: 'General Awareness & Current Affairs', questions: [] }
      ];
    }
    if (code.includes('group-d') || t.includes('group d') || t.includes('level-1')) {
      return [
        { id: 'sec_1', name: 'General Science', questions: [] },
        { id: 'sec_2', name: 'Mathematics', questions: [] },
        { id: 'sec_3', name: 'General Intelligence and Reasoning', questions: [] },
        { id: 'sec_4', name: 'General Awareness and Current Affairs', questions: [] }
      ];
    }
    // NTPC UG & Graduate
    return [
      { id: 'sec_1', name: 'General Awareness', questions: [] },
      { id: 'sec_2', name: 'Mathematics', questions: [] },
      { id: 'sec_3', name: 'General Intelligence and Reasoning', questions: [] }
    ];
  }

  if (isSSC) {
    if (code.includes('mts') || t.includes('mts')) {
      return [
        { id: 'sec_1', name: 'Numerical and Mathematical Ability', questions: [] },
        { id: 'sec_2', name: 'Reasoning Ability and Problem Solving', questions: [] },
        { id: 'sec_3', name: 'General Awareness', questions: [] },
        { id: 'sec_4', name: 'English Language and Comprehension', questions: [] }
      ];
    }
    // CGL, CHSL, etc.
    return [
      { id: 'sec_1', name: 'General Intelligence & Reasoning', questions: [] },
      { id: 'sec_2', name: 'General Awareness', questions: [] },
      { id: 'sec_3', name: 'Quantitative Aptitude', questions: [] },
      { id: 'sec_4', name: 'English Comprehension', questions: [] }
    ];
  }

  return [
    { id: 'sec_1', name: 'General Intelligence & Reasoning', questions: [] },
    { id: 'sec_2', name: 'General Awareness', questions: [] },
    { id: 'sec_3', name: 'Quantitative Aptitude', questions: [] },
    { id: 'sec_4', name: 'English Comprehension', questions: [] }
  ];
}

export async function getAvailableTests(filterExam?: string): Promise<CBTTest[]> {
  // 1. Fetch from Supabase tests table
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        let mapped = data.map((t) => ({
          id: t.id,
          title: t.title,
          examCode: t.exam_code,
          examFamily: t.exam_code?.startsWith('rrb') ? 'rrb' : 'ssc',
          type: t.type || 'pyq',
          durationMinutes: t.duration_minutes || 60,
          totalMarks: t.total_marks || 100,
          totalQuestions: t.total_questions || 100,
          isPublished: t.is_published ?? true,
          sections: getStandardSections(t.exam_code, t.title)
        })) as unknown as CBTTest[];

        if (filterExam && filterExam !== 'all') {
          const filter = filterExam.toLowerCase();
          mapped = mapped.filter((t) => {
            const code = (t.examCode || '').toLowerCase();
            return code.includes(filter) || t.examFamily === filter;
          });
        }
        return mapped;
      }
    } catch (e) {
      console.warn('Failed to query tests from Supabase:', e);
    }
  }

  // Fallback to static catalog
  const all = testsCatalog as unknown as CBTTest[];
  if (filterExam && filterExam !== 'all') {
    return all.filter((t) => {
      const code = (t.examCode || '').toLowerCase();
      const filter = filterExam.toLowerCase();
      return code.includes(filter) || t.examFamily === filter;
    });
  }
  return all;
}

export async function getTestById(id: string, excludeIds: string[] = []): Promise<CBTTest | undefined> {
  const cleanId = decodeURIComponent(id || '').trim();

  // Check runtime memory store (bypass if excludeIds are provided for fresh adaptive generation)
  if (testsStore.has(cleanId) && excludeIds.length === 0) {
    return testsStore.get(cleanId);
  }

  // 1. Dynamic Sectional Test (e.g. sec-rrb-ntpc-grad-2025-shift-1-sec-0 or sec-ssc-cgl-2025-tier2-shift-1-sec-0)
  if (cleanId.startsWith('sec-')) {
    const shiftMatch = cleanId.match(/^sec-(.+)-sec-(\d+)$/);
    if (shiftMatch) {
      const parentId = shiftMatch[1];
      const secIdx = parseInt(shiftMatch[2], 10);
      const parent = await getTestById(parentId);
      if (parent && parent.sections && parent.sections[secIdx]) {
        const targetSec = parent.sections[secIdx];
        const isRailway = (parent.examFamily === 'rrb' || (parent.examCode || '').toLowerCase().includes('rrb'));
        const isTier2 = (parent.examCode || '').toLowerCase().includes('tier2') ||
                        (parent.examCode || '').toLowerCase().includes('tier-2') ||
                        parent.title.toLowerCase().includes('tier 2') ||
                        parent.title.toLowerCase().includes('tier-2') ||
                        parent.title.toLowerCase().includes('tier ii');
        const duration = isTier2 
          ? (targetSec.name.includes('Computer') ? 15 : (targetSec.name.includes('General Awareness') ? 20 : (targetSec.name.includes('English') ? 35 : 30)))
          : (isRailway ? 25 : 15);
        const questionsList = targetSec.questions || [];
        const count = questionsList.length || (isTier2 ? 30 : 25);
        const marksPerQ = isTier2 ? 3 : (isRailway ? 1 : 2);
        const negMarks = isTier2 ? 1 : (isRailway ? Number((1 / 3).toFixed(2)) : 0.5);
        const singleSec: CBTTest = {
          id: cleanId,
          title: `${targetSec.name} — ${parent.title} (${isTier2 ? 'Tier-2 ' : ''}Sectional Mock)`,
          examCode: parent.examCode || 'ssc-cgl',
          examFamily: isRailway ? 'rrb' : 'ssc',
          type: 'sectional',
          durationMinutes: duration,
          totalMarks: count * marksPerQ,
          totalQuestions: count,
          positiveMarks: marksPerQ,
          negativeMarks: negMarks,
          isPublished: true,
          hasSectionalTiming: true,
          sectionalTimingMinutes: duration,
          sections: [{
            id: targetSec.id || `sec-${secIdx}`,
            name: targetSec.name,
            questions: questionsList.map(q => ({
              ...q,
              marks: marksPerQ,
              negativeMarks: negMarks
            }))
          }]
        };
        testsStore.set(cleanId, singleSec);
        return singleSec;
      }
    }
  }

  // 2. Fetch full shift from Supabase tests and questions table
  const client = supabaseAdmin || supabase;
  if (client) {
    try {
      // Look up test record by exact id or like id
      let { data: testRow } = await client
        .from('tests')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (!testRow) {
        const { data: rowAlt } = await client
          .from('tests')
          .select('*')
          .ilike('id', cleanId.replace(/_/g, '-'))
          .maybeSingle();
        testRow = rowAlt;
      }

      if (testRow) {
        const { data: qRows, error: qErr } = await client
          .from('questions')
          .select('*')
          .eq('test_id', testRow.id)
          .order('question_number', { ascending: true });

        if (qRows && !qErr && qRows.length > 0) {
          const isTier2 = (testRow.exam_code || '').toLowerCase().includes('tier2') ||
                          (testRow.exam_code || '').toLowerCase().includes('tier-2') ||
                          (testRow.title || '').toLowerCase().includes('tier 2') ||
                          (testRow.title || '').toLowerCase().includes('tier-2') ||
                          (testRow.title || '').toLowerCase().includes('tier ii') ||
                          testRow.id.includes('tier2');
          const isSSC = (testRow.exam_code || '').toLowerCase().includes('ssc') ||
                        (testRow.title || '').toLowerCase().includes('ssc');
          const isRailway = (testRow.exam_code || '').toLowerCase().includes('rrb') ||
                            (testRow.title || '').toLowerCase().includes('rrb') ||
                            (testRow.title || '').toLowerCase().includes('railway');

          const getSectionName = (qno: number, totalQ: number, existingSec?: string): string => {
            if (existingSec && existingSec !== 'null' && existingSec !== 'undefined' && existingSec.trim().length > 0) {
              return existingSec;
            }
            if (isSSC) {
              if (totalQ === 100) {
                if (qno <= 25) return 'General Intelligence & Reasoning';
                if (qno <= 50) return 'General Awareness';
                if (qno <= 75) return 'Quantitative Aptitude';
                return 'English Comprehension';
              }
              if (totalQ === 150) {
                if (qno <= 30) return 'Mathematical Abilities';
                if (qno <= 60) return 'Reasoning and General Intelligence';
                if (qno <= 105) return 'English Language and Comprehension';
                if (qno <= 130) return 'General Awareness';
                return 'Computer Knowledge';
              }
              if (totalQ === 135) {
                if (qno <= 30) return 'Mathematical Abilities';
                if (qno <= 60) return 'Reasoning and General Intelligence';
                if (qno <= 100) return 'English Language and Comprehension';
                if (qno <= 120) return 'General Awareness';
                return 'Computer Knowledge';
              }
              if (totalQ === 130) {
                if (qno <= 30) return 'Mathematical Abilities';
                if (qno <= 60) return 'Reasoning and General Intelligence';
                if (qno <= 105) return 'English Language and Comprehension';
                return 'General Awareness';
              }
            }
            if (isRailway) {
              if (totalQ === 100) {
                if (qno <= 40) return 'General Awareness';
                if (qno <= 70) return 'Mathematics';
                return 'General Intelligence and Reasoning';
              }
              if (totalQ === 75) {
                if (qno <= 20) return 'Mathematics';
                if (qno <= 45) return 'General Intelligence & Reasoning';
                if (qno <= 65) return 'General Science';
                return 'General Awareness & Current Affairs';
              }
            }
            return 'General Section';
          };

          const qMarks = isTier2 ? 3 : (isSSC ? 2 : 1);
          const qNegMarks = isTier2 ? 1 : (isSSC ? 0.5 : Number((1 / 3).toFixed(2)));

          const sectionMap = new Map<string, CBTQuestion[]>();

          qRows.forEach((q) => {
            const secName = getSectionName(q.question_number, qRows.length, q.section_id);
            if (!sectionMap.has(secName)) {
              sectionMap.set(secName, []);
            }

            const rawOptions = Array.isArray(q.options) ? q.options : [];
            const mappedOptions = rawOptions.map((o: any, idx: number) => ({
              id: o.id || idx + 1,
              text: o.text_en || o.text || `Option ${o.id || idx + 1}`,
              textHi: o.text_hi || o.text_en || o.text || `Option ${o.id || idx + 1}`,
              imageUrl: o.imageUrl
            }));

            sectionMap.get(secName)!.push({
              id: q.id,
              qno: q.question_number,
              questionText: q.question_text_en || '',
              questionTextHi: q.question_text_hi || q.question_text_en || '',
              questionImages: q.question_images || [],
              options: mappedOptions,
              correctOption: q.correct_option_index || 1,
              explanation: q.explanation_en || '',
              explanationHi: q.explanation_hi || q.explanation_en || '',
              marks: qMarks,
              negativeMarks: qNegMarks,
              sectionName: secName,
              examOrigin: testRow.title
            });
          });

          const sections: CBTSection[] = Array.from(sectionMap.entries()).map(([name, qs], idx) => ({
            id: `sec_${idx + 1}`,
            name,
            questions: qs
          }));

          const cbtTest: CBTTest = {
            id: testRow.id,
            title: testRow.title,
            examCode: testRow.exam_code,
            examFamily: isRailway ? 'rrb' : 'ssc',
            type: (testRow.type as any) || 'pyq',
            durationMinutes: testRow.duration_minutes || (isTier2 ? 135 : (isRailway ? 90 : 60)),
            totalMarks: testRow.total_marks || (qRows.length * qMarks),
            totalQuestions: testRow.total_questions || qRows.length,
            positiveMarks: qMarks,
            negativeMarks: qNegMarks,
            hasSectionalTiming: isSSC,
            sectionalTimingMinutes: isTier2 ? 30 : (isSSC ? 15 : undefined),
            isPublished: testRow.is_published ?? true,
            sections
          };

          testsStore.set(cleanId, cbtTest);
          testsStore.set(testRow.id, cbtTest);
          return cbtTest;
        }
      }
    } catch (err) {
      console.warn(`Supabase load failed for test ${cleanId}:`, err);
    }
  }

  // 3. Dynamic Chapter or Topic Test (ch-... or topic-...) with Anti-Repetition Adaptive Selection
  if (cleanId.startsWith('ch-') || cleanId.startsWith('topic-')) {
    const rawParts = cleanId.replace(/^ch-|^topic-/, '').split('-');
    let duration = 15;
    let count = 20;
    const tokens = [...rawParts];

    if (tokens.length >= 3 && !isNaN(Number(tokens[tokens.length - 1])) && !isNaN(Number(tokens[tokens.length - 2]))) {
      duration = parseInt(tokens.pop()!, 10);
      count = parseInt(tokens.pop()!, 10);
    } else if (tokens.length >= 2 && !isNaN(Number(tokens[tokens.length - 1]))) {
      count = parseInt(tokens.pop()!, 10);
      duration = Math.max(10, count);
    }

    const subjects = ['math', 'reasoning', 'english', 'ga'];
    const subIdx = tokens.findIndex((t) => subjects.includes(t));
    let examFilter: string | undefined = undefined;
    let subject: 'math' | 'reasoning' | 'english' | 'ga' = 'math';
    let topicSlug = '';

    if (subIdx > 0) {
      examFilter = tokens.slice(0, subIdx).join('-');
      subject = tokens[subIdx] as any;
      topicSlug = tokens.slice(subIdx + 1).join('-');
    } else if (subIdx === 0) {
      subject = tokens[0] as any;
      topicSlug = tokens.slice(1).join('-');
    } else {
      topicSlug = tokens.join('-');
    }

    // Try fetching authentic series questions directly from Supabase
    const client = supabaseAdmin || supabase;
    if (client && examFilter) {
      try {
        let qQuery = client.from('questions')
          .select('id, test_id, question_number, question_text_en, question_text_hi, question_images, options, correct_option_index, explanation_en, explanation_hi')
          .ilike('test_id', `${examFilter}%`);

        if (examFilter.startsWith('ssc')) {
          if (subject === 'reasoning') qQuery = qQuery.gte('question_number', 1).lte('question_number', 25);
          else if (subject === 'ga') qQuery = qQuery.gte('question_number', 26).lte('question_number', 50);
          else if (subject === 'math') qQuery = qQuery.gte('question_number', 51).lte('question_number', 75);
          else if (subject === 'english') qQuery = qQuery.gte('question_number', 76).lte('question_number', 100);
        } else if (examFilter.includes('ntpc')) {
          if (subject === 'ga') qQuery = qQuery.gte('question_number', 1).lte('question_number', 40);
          else if (subject === 'math') qQuery = qQuery.gte('question_number', 41).lte('question_number', 70);
          else if (subject === 'reasoning') qQuery = qQuery.gte('question_number', 71).lte('question_number', 100);
        } else if (examFilter.includes('alp')) {
          if (subject === 'math') qQuery = qQuery.gte('question_number', 1).lte('question_number', 20);
          else if (subject === 'reasoning') qQuery = qQuery.gte('question_number', 21).lte('question_number', 45);
          else if (subject === 'ga') qQuery = qQuery.gte('question_number', 46).lte('question_number', 75);
        } else if (examFilter.includes('group-d')) {
          if (subject === 'ga') qQuery = qQuery.or('question_number.lte.25,question_number.gte.81');
          else if (subject === 'math') qQuery = qQuery.gte('question_number', 26).lte('question_number', 50);
          else if (subject === 'reasoning') qQuery = qQuery.gte('question_number', 51).lte('question_number', 80);
        }

        const { data: dbQuestions, error: dbErr } = await qQuery.limit(300);

        if (dbQuestions && !dbErr && dbQuestions.length > 0) {
          const cleanSlug = topicSlug.toLowerCase().replace(/-/g, ' ');
          let matchingQuestions = dbQuestions.filter((q) => {
            const t = (q.question_text_en || '').toLowerCase();
            if (topicSlug.includes('trig') && (t.includes('sin') || t.includes('cos') || t.includes('tan') || t.includes('trigonometr') || t.includes('elevation') || t.includes('heights and distance'))) return true;
            if (topicSlug.includes('algebra') && (/x\^2|x\^3|a\^2|a\^3|\bx\s*[\+\-]\s*1\/x\b|algebra|polynomial/i.test(t))) return true;
            if (topicSlug.includes('geomet') && (/\b(circle|chord|tangent|radius|triangle|hypotenuse|rhombus|trapezium)\b/i.test(t))) return true;
            if (topicSlug.includes('mensur') && (/\b(cylinder|cone|sphere|hemisphere|cuboid|cube|surface area|volume|perimeter)\b/i.test(t))) return true;
            if (topicSlug.includes('profit') && (/\b(profit|loss|cost price|selling price|marked price|discount|markup)\b/i.test(t))) return true;
            if (topicSlug.includes('interest') && (/\b(compound interest|simple interest|sum of money|invested at|annually)\b/i.test(t))) return true;
            if ((topicSlug.includes('time-work') || topicSlug.includes('work')) && (/\b(pipe|pipes|cistern|fill a tank|work together|days to complete|efficiency)\b/i.test(t))) return true;
            if ((topicSlug.includes('distance') || topicSlug.includes('train')) && (/\b(train|trains|km\/h|m\/s|speed|boat|stream|relative speed)\b/i.test(t))) return true;
            if (topicSlug.includes('percent') && (/\b(percentage|percent|ratio|proportion|partnership)\b/i.test(t) || t.includes('%'))) return true;
            if (topicSlug.includes('average') && (/\b(average|mean|mixture|alligation|blended)\b/i.test(t))) return true;
            if (topicSlug.includes('coding') && (t.includes('code') || t.includes('coded') || t.includes('written as'))) return true;
            if (topicSlug.includes('blood') && (t.includes('brother') || t.includes('sister') || t.includes('father') || t.includes('mother') || t.includes('daughter') || t.includes('son'))) return true;
            if (topicSlug.includes('syllog') && (t.includes('statement') || t.includes('conclusion') || t.includes('syllogism') || t.includes('all ') || t.includes('some '))) return true;
            if ((topicSlug.includes('mirror') || topicSlug.includes('non-verbal')) && (t.includes('mirror') || t.includes('water image') || t.includes('paper'))) return true;
            if (topicSlug.includes('dice') && (t.includes('dice') || t.includes('cube') || t.includes('opposite face') || t.includes('triangle'))) return true;
            if (topicSlug.includes('direction') && (t.includes('north') || t.includes('south') || t.includes('east') || t.includes('west') || t.includes('turns left'))) return true;
            if ((topicSlug.includes('synonym') || topicSlug.includes('antonym')) && (t.includes('synonym') || t.includes('antonym') || t.includes('meaning') || t.includes('opposite'))) return true;
            if (topicSlug.includes('idiom') && (t.includes('idiom') || t.includes('phrase'))) return true;
            if (topicSlug.includes('one-word') && (t.includes('one word') || t.includes('substitute'))) return true;
            if (topicSlug.includes('spelling') && (t.includes('misspelt') || t.includes('correctly spelt') || t.includes('spelling'))) return true;
            if (topicSlug.includes('error') && (t.includes('error') || t.includes('grammatical') || t.includes('incorrect'))) return true;
            if (topicSlug.includes('polity') && (t.includes('constitution') || t.includes('article') || t.includes('amendment') || t.includes('president') || t.includes('parliament'))) return true;
            if (topicSlug.includes('history') && (t.includes('dynasty') || t.includes('battle') || t.includes('ruler') || t.includes('gandhi') || t.includes('british') || t.includes('revolt'))) return true;
            if (topicSlug.includes('geography') && (t.includes('river') || t.includes('mountain') || t.includes('soil') || t.includes('state') || t.includes('plateau'))) return true;
            if (topicSlug.includes('science') && (t.includes('acid') || t.includes('cell') || t.includes('reaction') || t.includes('velocity') || t.includes('disease') || t.includes('energy'))) return true;
            return cleanSlug.split(' ').some((word) => word.length > 3 && t.includes(word));
          });

          if (matchingQuestions.length === 0) {
            matchingQuestions = dbQuestions;
          }

          // Anti-repetition Adaptive Selection: Exclude questions user already solved correctly!
          const excludeSet = new Set(excludeIds || []);
          const unmastered = matchingQuestions.filter((q) => !excludeSet.has(q.id));

          let chosenList = [];
          if (unmastered.length >= count) {
            chosenList = unmastered.slice(0, count);
          } else {
            chosenList = [...unmastered];
            const needed = count - chosenList.length;
            const recycled = matchingQuestions.filter((q) => excludeSet.has(q.id)).slice(0, needed);
            chosenList = [...chosenList, ...recycled];
          }

          const isRailway = examFilter.includes('rrb') || examFilter.includes('alp') || examFilter.includes('ntpc');
          const isTier2 = examFilter.includes('tier2') || examFilter.includes('tier-2');
          const marksPerQ = isTier2 ? 3 : (isRailway ? 1 : 2);
          const negMarks = isTier2 ? 1 : (isRailway ? Number((1 / 3).toFixed(2)) : 0.5);

          const finalQuestions: CBTQuestion[] = chosenList.map((q, idx) => {
            const rawOptions = Array.isArray(q.options) ? q.options : [];
            const mappedOptions = rawOptions.map((o: any, oIdx: number) => ({
              id: o.id || oIdx + 1,
              text: o.text_en || o.text || `Option ${o.id || oIdx + 1}`,
              textHi: o.text_hi || o.text_en || o.text || `Option ${o.id || oIdx + 1}`,
              imageUrl: o.imageUrl
            }));
            return {
              id: q.id,
              qno: idx + 1,
              questionText: q.question_text_en || '',
              questionTextHi: q.question_text_hi || q.question_text_en || '',
              questionImages: q.question_images || [],
              options: mappedOptions,
              correctOption: q.correct_option_index || 1,
              explanation: q.explanation_en || '',
              explanationHi: q.explanation_hi || q.explanation_en || '',
              marks: marksPerQ,
              negativeMarks: negMarks,
              sectionName: topicSlug.replace(/-/g, ' ').toUpperCase(),
              examOrigin: `${examFilter.toUpperCase()} Authentic PYQ`
            };
          });

          const topicTitle = topicSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const cbtTest: CBTTest = {
            id: cleanId,
            title: `${topicTitle} — ${examFilter.toUpperCase()} Official PYQ Topic Drill (${finalQuestions.length} Qs • ${duration} Mins)`,
            examCode: examFilter,
            examFamily: isRailway ? 'rrb' : 'ssc',
            type: 'chapter',
            durationMinutes: duration,
            totalMarks: finalQuestions.length * marksPerQ,
            totalQuestions: finalQuestions.length,
            positiveMarks: marksPerQ,
            negativeMarks: negMarks,
            isPublished: true,
            hasSectionalTiming: false,
            sections: [{
              id: 'sec_1',
              name: topicTitle,
              questions: finalQuestions
            }]
          };
          testsStore.set(cleanId, cbtTest);
          return cbtTest;
        }
      } catch (err) {
        console.warn('Dynamic topic test fetch failed, falling back:', err);
      }
    }

    const availableChapters = CHAPTER_TAXONOMY[subject] || [];
    const matchedChapter =
      availableChapters.find(
        (ch) =>
          encodeURIComponent(ch).replace(/%20/g, '-').toLowerCase() === topicSlug ||
          ch.toLowerCase().includes(topicSlug.replace(/-/g, ' ').toLowerCase())
      ) || availableChapters[0] || 'Topic Practice';

    const test = generateChapterTest(subject, matchedChapter, count, duration, examFilter);
    test.id = cleanId;
    test.durationMinutes = duration;
    test.title = `${matchedChapter} — Official PYQ Topic Drill (${test.totalQuestions} Qs • ${duration} Mins)`;
    testsStore.set(cleanId, test);
    return test;
  }

  return undefined;
}
