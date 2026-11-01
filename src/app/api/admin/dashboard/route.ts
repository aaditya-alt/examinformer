import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getUniqueShiftSubmissions } from '@/lib/scoreService';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORTS_FILE = path.join(process.cwd(), 'src', 'data', 'question-reports.json');

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
              totalTimeSpentSeconds: 0,
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
          .limit(500);

        if (!attErr && attData) {
          attemptsList = attData;
        }
      } catch (e) {
        console.warn('Could not fetch test_attempts from Supabase:', e);
      }
    }

    // Compute candidate total study time across attempts
    attemptsList.forEach(a => {
      const match = candidatesList.find(c => c.id === a.user_id || c.name === a.candidate_name);
      if (match) {
        match.totalTimeSpentSeconds = (match.totalTimeSpentSeconds || 0) + (Number(a.time_taken_seconds) || 0);
        match.attemptsCount = Math.max(match.attemptsCount, 1);
      }
    });

    // 3. Hourly Activity Distribution (00:00 to 23:00)
    const hourlyActivity: { hour: number; label: string; count: number; totalSeconds: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      hourlyActivity.push({ hour: h, label, count: 0, totalSeconds: 0 });
    }

    attemptsList.forEach(a => {
      if (a.created_at) {
        const hour = new Date(a.created_at).getHours();
        if (hourlyActivity[hour]) {
          hourlyActivity[hour].count++;
          hourlyActivity[hour].totalSeconds += Number(a.time_taken_seconds) || 0;
        }
      }
    });

    // 4. Day-wise Activity (last 14 days)
    const dayMap = new Map<string, { date: string; attempts: number; uniqueUsers: Set<string>; totalSeconds: number }>();
    for (let d = 13; d >= 0; d--) {
      const dateStr = new Date(Date.now() - d * 86400000).toISOString().split('T')[0];
      dayMap.set(dateStr, { date: dateStr, attempts: 0, uniqueUsers: new Set(), totalSeconds: 0 });
    }

    attemptsList.forEach(a => {
      if (a.created_at) {
        const dStr = a.created_at.split('T')[0];
        if (dayMap.has(dStr)) {
          const entry = dayMap.get(dStr)!;
          entry.attempts++;
          entry.totalSeconds += Number(a.time_taken_seconds) || 0;
          if (a.user_id || a.candidate_name) {
            entry.uniqueUsers.add(a.user_id || a.candidate_name);
          }
        }
      }
    });

    const dayWiseActivity = Array.from(dayMap.values()).map(d => ({
      date: d.date,
      attempts: d.attempts,
      activeUsers: d.uniqueUsers.size,
      totalHours: Math.round((d.totalSeconds / 3600) * 10) / 10
    }));

    // 5. Unique Shift Submissions from Answer Key Calculator
    const uniqueShifts = getUniqueShiftSubmissions();

    // 6. Question Reports
    let questionReports: any[] = [];
    try {
      if (fs.existsSync(REPORTS_FILE)) {
        questionReports = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
      }
    } catch {}

    // Compute summary metrics
    const totalCandidates = candidatesList.length;
    const totalAttempts = attemptsList.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attemptsList.reduce((acc, a) => acc + (Number(a.total_score) || 0), 0) / totalAttempts * 10) / 10
      : 0;
    const avgAccuracy = totalAttempts > 0
      ? Math.round(attemptsList.reduce((acc, a) => acc + (Number(a.accuracy) || 0), 0) / totalAttempts * 10) / 10
      : 0;
    const totalStudyHours = Math.round(attemptsList.reduce((acc, a) => acc + (Number(a.time_taken_seconds) || 0), 0) / 3600 * 10) / 10;

    return NextResponse.json({
      success: true,
      overview: {
        totalCandidates,
        totalAttempts,
        totalStudyHours,
        avgScore,
        avgAccuracy,
        pendingReportsCount: questionReports.filter(r => r.status === 'pending').length,
        uniqueShiftsCount: uniqueShifts.length,
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
      })),
      hourlyActivity,
      dayWiseActivity,
      uniqueShifts,
      questionReports
    });
  } catch (err: any) {
    console.error('API /admin/dashboard error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error loading admin dashboard' },
      { status: 500 }
    );
  }
}
