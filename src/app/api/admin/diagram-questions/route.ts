import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEL_POST_FILE = path.join(process.cwd(), 'src', 'data', 'ssc_selection_post_all_shifts.json');

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'missing' | 'has_image'
    const subject = searchParams.get('subject') || 'all'; // 'all' | 'reasoning' | 'math'

    const list: any[] = [];
    const client = supabaseAdmin || supabase;

    // 1. Load from Selection Post dataset
    if (fs.existsSync(SEL_POST_FILE)) {
      try {
        const selData = JSON.parse(fs.readFileSync(SEL_POST_FILE, 'utf-8'));
        const shiftKeys = testId ? [testId] : Object.keys(selData);

        for (const sKey of shiftKeys) {
          const shift = selData[sKey];
          if (!shift || !shift.questions) continue;

          for (const [qnoStr, q] of Object.entries<any>(shift.questions)) {
            const secName = q.section_name || '';
            if (subject === 'reasoning' && !secName.toLowerCase().includes('reasoning') && !secName.toLowerCase().includes('intelligence')) {
              continue;
            }
            if (subject === 'math' && !secName.toLowerCase().includes('quant') && !secName.toLowerCase().includes('math')) {
              continue;
            }

            const hasImg = Boolean(
              (q.question_images && q.question_images.length > 0) ||
              (q.questionImages && q.questionImages.length > 0) ||
              (q.options && q.options.some((o: any) => o.imageUrl))
            );

            const isVisualFlag = Boolean(q.has_image || q.needs_image);

            if (filter === 'missing' && hasImg) continue;
            if (filter === 'has_image' && !hasImg) continue;
            if (filter === 'all' && !hasImg && !isVisualFlag) continue;

            list.push({
              id: q.id,
              testId: sKey,
              testTitle: shift.title || sKey,
              qno: q.question_number,
              sectionName: secName,
              questionTextEn: q.question_text_en || q.questionText || '',
              questionTextHi: q.question_text_hi || q.questionTextHi || '',
              options: q.options || [],
              correctOptionIndex: q.correct_option_index ?? q.correctOption ?? 0,
              explanationEn: q.explanation_en || q.explanation || '',
              explanationHi: q.explanation_hi || q.explanationHi || '',
              questionImages: q.question_images || q.questionImages || [],
              hasImage: hasImg,
              needsImage: isVisualFlag && !hasImg
            });
          }
        }
      } catch (err) {
        console.warn('Error reading selection post for diagram questions:', err);
      }
    }

    return NextResponse.json({ success: true, count: list.length, questions: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { testId, qno, questionImages, options, questionTextEn, questionTextHi, explanationEn, explanationHi, correctOptionIndex } = body;

    if (!testId || !qno) {
      return NextResponse.json({ success: false, error: 'testId and qno required' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;

    // 1. Update Supabase
    if (client) {
      try {
        const updatePayload: any = {};
        if (questionImages !== undefined) updatePayload.question_images = questionImages;
        if (options !== undefined) updatePayload.options = options;
        if (questionTextEn !== undefined) updatePayload.question_text_en = questionTextEn;
        if (questionTextHi !== undefined) updatePayload.question_text_hi = questionTextHi;
        if (explanationEn !== undefined) updatePayload.explanation_en = explanationEn;
        if (explanationHi !== undefined) updatePayload.explanation_hi = explanationHi;
        if (correctOptionIndex !== undefined) updatePayload.correct_option_index = correctOptionIndex;

        await client
          .from('questions')
          .update(updatePayload)
          .eq('test_id', testId)
          .eq('question_number', qno);
      } catch (e) {
        console.warn('Supabase diagram update error:', e);
      }
    }

    // 2. Update local Selection Post file
    if (fs.existsSync(SEL_POST_FILE)) {
      try {
        const selData = JSON.parse(fs.readFileSync(SEL_POST_FILE, 'utf-8'));
        if (selData[testId] && selData[testId].questions && selData[testId].questions[String(qno)]) {
          const q = selData[testId].questions[String(qno)];
          if (questionImages !== undefined) {
            q.question_images = questionImages;
            q.questionImages = questionImages;
            q.has_image = questionImages.length > 0;
          }
          if (options !== undefined) q.options = options;
          if (questionTextEn !== undefined) q.question_text_en = questionTextEn;
          if (questionTextHi !== undefined) q.question_text_hi = questionTextHi;
          if (explanationEn !== undefined) q.explanation_en = explanationEn;
          if (explanationHi !== undefined) q.explanation_hi = explanationHi;
          if (correctOptionIndex !== undefined) q.correct_option_index = correctOptionIndex;

          fs.writeFileSync(SEL_POST_FILE, JSON.stringify(selData, null, 2), 'utf-8');
        }
      } catch (e) {
        console.warn('Local Selection Post JSON update error:', e);
      }
    }

    // 3. Update local test file if exists
    try {
      const localTestFile = path.join(process.cwd(), 'src', 'data', 'tests', `${testId}.json`);
      if (fs.existsSync(localTestFile)) {
        const tData = JSON.parse(fs.readFileSync(localTestFile, 'utf-8'));
        for (const sec of tData.sections || []) {
          for (const q of sec.questions || []) {
            if (q.qno === qno) {
              if (questionImages !== undefined) q.questionImages = questionImages;
              if (options !== undefined) q.options = options;
              if (questionTextEn !== undefined) q.questionText = questionTextEn;
              if (questionTextHi !== undefined) q.questionTextHi = questionTextHi;
              if (explanationEn !== undefined) q.explanation = explanationEn;
              if (explanationHi !== undefined) q.explanationHi = explanationHi;
              if (correctOptionIndex !== undefined) q.correctOption = correctOptionIndex + 1;
              break;
            }
          }
        }
        fs.writeFileSync(localTestFile, JSON.stringify(tData, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('Local test file update error:', e);
    }

    return NextResponse.json({ success: true, message: 'Question updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
