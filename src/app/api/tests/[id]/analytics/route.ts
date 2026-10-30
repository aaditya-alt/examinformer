import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getTestById } from '@/lib/testService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const test = getTestById(id);

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  let attemptsList: any[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('test_attempts')
        .select('id, total_score, accuracy, time_taken_seconds, responses')
        .eq('test_id', id);

      if (!error && data) {
        attemptsList = data;
      }
    } catch (e) {
      console.warn('Could not fetch test_attempts from Supabase:', e);
    }
  }

  const totalAttempts = attemptsList.length;

  // Calculate question-level stats from all real attempts
  const questionStats: Record<number, { correctPct: number; wrongPct: number; skippedPct: number; totalAnswered: number }> = {};

  test.sections.forEach(sec => {
    sec.questions.forEach(q => {
      const qno = q.qno;
      let qCorrect = 0;
      let qWrong = 0;
      let qSkipped = 0;

      attemptsList.forEach(att => {
        const resp = att.responses?.[qno];
        if (resp && resp.chosenOption !== undefined) {
          if (resp.chosenOption === q.correctOption) {
            qCorrect++;
          } else {
            qWrong++;
          }
        } else {
          qSkipped++;
        }
      });

      const totalAnswered = qCorrect + qWrong;
      const totalCandidates = Math.max(1, attemptsList.length);

      questionStats[qno] = {
        correctPct: totalAnswered > 0 ? Math.round((qCorrect / totalAnswered) * 100) : 60,
        wrongPct: totalAnswered > 0 ? Math.round((qWrong / totalAnswered) * 100) : 30,
        skippedPct: Math.round((qSkipped / totalCandidates) * 100),
        totalAnswered
      };
    });
  });

  return NextResponse.json({
    success: true,
    totalAttempts,
    attempts: attemptsList.map(a => ({
      id: a.id,
      score: a.total_score,
      accuracy: a.accuracy,
      time: a.time_taken_seconds
    })),
    questionStats
  });
}
