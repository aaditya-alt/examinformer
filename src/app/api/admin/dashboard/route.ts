import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function GET() {
  try {
    let candidatesList: any[] = [];
    let attemptsList: any[] = [];

    // 1. Fetch registered candidates from Supabase Auth
    if (supabaseAdmin) {
      try {
        const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000
        });

        if (!usersErr && usersData?.users) {
          candidatesList = usersData.users.map(u => {
            const meta = u.user_metadata || {};
            return {
              id: u.id,
              name: meta.full_name || meta.name || u.email?.split('@')[0] || 'Candidate',
              email: u.email || 'N/A',
              phone: meta.phone || 'N/A',
              rollNumber: meta.roll_number || 'N/A',
              category: meta.category || 'UR',
              attemptsCount: meta.test_attempts_count || 0,
              savedQuestionsCount: (meta.saved_questions || []).length,
              createdAt: u.created_at,
              lastSignInAt: u.last_sign_in_at
            };
          });
        }
      } catch (e) {
        console.warn('Could not fetch candidates from Supabase auth:', e);
      }
    }

    // 2. Fetch test attempts from public.test_attempts
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        const { data: attData, error: attErr } = await client
          .from('test_attempts')
          .select('id, test_id, user_id, candidate_name, total_score, accuracy, time_taken_seconds, created_at, responses')
          .order('created_at', { ascending: false })
          .limit(200);

        if (!attErr && attData) {
          attemptsList = attData;
        }
      } catch (e) {
        console.warn('Could not fetch test_attempts from Supabase:', e);
      }
    }

    // Compute summary metrics
    const totalCandidates = candidatesList.length;
    const totalAttempts = attemptsList.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attemptsList.reduce((acc, a) => acc + (Number(a.total_score) || 0), 0) / totalAttempts * 10) / 10
      : 0;
    const avgAccuracy = totalAttempts > 0
      ? Math.round(attemptsList.reduce((acc, a) => acc + (Number(a.accuracy) || 0), 0) / totalAttempts * 10) / 10
      : 0;

    return NextResponse.json({
      success: true,
      overview: {
        totalCandidates,
        totalAttempts,
        avgScore,
        avgAccuracy,
        databaseConnected: Boolean(supabaseAdmin || supabase)
      },
      candidates: candidatesList,
      attempts: attemptsList.map(a => ({
        id: a.id,
        testId: a.test_id,
        candidateName: a.candidate_name,
        score: Number(a.total_score) || 0,
        accuracy: Number(a.accuracy) || 0,
        timeTakenSeconds: Number(a.time_taken_seconds) || 0,
        createdAt: a.created_at
      }))
    });
  } catch (err: any) {
    console.error('API /admin/dashboard error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error loading admin dashboard' },
      { status: 500 }
    );
  }
}
