import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      testId,
      userId,
      candidateName,
      rollNumber,
      totalScore,
      accuracy,
      timeTakenSeconds,
      responses,
      sectionsBreakdown
    } = body;

    if (!testId) {
      return NextResponse.json({ error: 'testId is required' }, { status: 400 });
    }

    const client = supabaseAdmin || supabase;
    const finalUserId = userId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const finalName = candidateName || 'Candidate';
    const finalTime = Number(timeTakenSeconds) || 0;

    if (!client) {
      return NextResponse.json({
        success: true,
        attemptId: 'local_' + Date.now(),
        message: 'Saved locally (database not configured)'
      });
    }

    const payload = {
      test_id: testId,
      user_id: finalUserId,
      candidate_name: finalName,
      roll_number: rollNumber || undefined,
      total_score: Number(totalScore) || 0,
      accuracy: Number(accuracy) || 0,
      time_taken_seconds: finalTime,
      status: 'completed',
      responses: responses || {}
    };

    const { data, error } = await client
      .from('test_attempts')
      .insert(payload)
      .select('id, created_at');

    if (error) {
      console.error('Error inserting test attempt into Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const insertedId = data?.[0]?.id || 'att_' + Date.now();

    // 2. Synchronize candidate profile into public.users table in Supabase
    try {
      const { data: existingUser } = await client
        .from('users')
        .select('id, total_time_spent_seconds, attempts_count')
        .or(`id.eq.${finalUserId},name.eq.${finalName}`)
        .limit(1)
        .maybeSingle();

      if (existingUser) {
        await client
          .from('users')
          .update({
            total_time_spent_seconds: (existingUser.total_time_spent_seconds || 0) + finalTime,
            attempts_count: (existingUser.attempts_count || 0) + 1,
            last_active_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);
      } else {
        await client
          .from('users')
          .insert({
            id: finalUserId,
            name: finalName,
            roll_number: rollNumber || '2402' + Math.floor(100000 + Math.random() * 900000),
            total_time_spent_seconds: finalTime,
            attempts_count: 1,
            last_active_at: new Date().toISOString()
          });
      }
    } catch (uErr: any) {
      // Non-fatal if table not yet migrated
      console.warn('Syncing user profile into users table:', uErr?.message);
    }

    // 3. Also update user's attempt count in Supabase Auth if candidate is logged in via Auth
    if (supabaseAdmin && userId && !userId.startsWith('guest_') && !userId.startsWith('usr_')) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user) {
          const currentMeta = userData.user.user_metadata || {};
          const attemptsCount = (currentMeta.test_attempts_count || 0) + 1;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...currentMeta,
              test_attempts_count: attemptsCount,
              last_attempt_at: new Date().toISOString()
            }
          });
        }
      } catch (e) {
        console.warn('Could not update candidate metadata attempt count:', e);
      }
    }

    return NextResponse.json({
      success: true,
      attemptId: insertedId,
      createdAt: data?.[0]?.created_at || new Date().toISOString()
    });
  } catch (err: any) {
    console.error('API /attempts error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while saving test attempt' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const testId = searchParams.get('testId');
    const attemptId = searchParams.get('attemptId');
    const limit = Number(searchParams.get('limit')) || 50;

    const client = supabaseAdmin || supabase;

    if (!client) {
      return NextResponse.json({ success: true, attempts: [] });
    }

    let query = client
      .from('test_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (attemptId) {
      query = query.eq('id', attemptId);
    } else {
      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (testId) {
        query = query.eq('test_id', testId);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching test_attempts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attempts: data || []
    });
  } catch (err: any) {
    console.error('API /attempts GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching attempts' },
      { status: 500 }
    );
  }
}
