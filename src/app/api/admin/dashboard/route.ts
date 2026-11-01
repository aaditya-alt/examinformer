import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getUniqueShiftSubmissions, computeShiftDifficultyAnalytics } from '@/lib/scoreService';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPORTS_FILE = path.join(process.cwd(), 'src', 'storage', 'question-reports.json');
const REVIEWS_FILE = path.join(process.cwd(), 'src', 'storage', 'student-reviews.json');

export async function GET() {
  try {
    const candidatesMap = new Map<string, any>();
    let attemptsList: any[] = [];
    const client = supabaseAdmin || supabase;

    // 1. Fetch from public.users table in Supabase
    if (client) {
      try {
        const { data: dbUsers, error: uErr } = await client
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!uErr && Array.isArray(dbUsers)) {
          dbUsers.forEach(u => {
            const key = u.id || u.email || u.name;
            candidatesMap.set(key, {
              id: u.id,
              name: u.name || 'Candidate',
              email: u.email || 'N/A',
              phone: u.phone || 'N/A',
              rollNumber: u.roll_number || 'N/A',
              category: u.category || 'UR',
              attemptsCount: Number(u.attempts_count) || 0,
              savedQuestionsCount: 0,
              totalTimeSpentSeconds: Number(u.total_time_spent_seconds) || 0,
              createdAt: u.created_at,
              lastSignInAt: u.last_active_at
            });
          });
        }
      } catch (e) {
        console.warn('Could not fetch users table from Supabase:', e);
      }
    }

    // 2. Fetch registered candidates from Supabase Auth
    if (supabaseAdmin) {
      try {
        const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000
        });

        if (!usersErr && usersData?.users) {
          usersData.users.forEach(u => {
            const meta = u.user_metadata || {};
            const key = u.id;
            const existing = candidatesMap.get(key) || {};
            candidatesMap.set(key, {
              id: u.id,
              name: meta.full_name || meta.name || existing.name || u.email?.split('@')[0] || 'Candidate',
              email: u.email || existing.email || 'N/A',
              phone: meta.phone || existing.phone || 'N/A',
              rollNumber: meta.roll_number || existing.rollNumber || 'N/A',
              category: meta.category || existing.category || 'UR',
              attemptsCount: Math.max(meta.test_attempts_count || 0, existing.attemptsCount || 0),
              savedQuestionsCount: (meta.saved_questions || []).length,
              totalTimeSpentSeconds: existing.totalTimeSpentSeconds || 0,
              createdAt: u.created_at || existing.createdAt,
              lastSignInAt: u.last_sign_in_at || existing.lastSignInAt
            });
          });
        }
      } catch (e) {
        console.warn('Could not fetch candidates from Supabase auth:', e);
      }
    }

    // 3. Fetch test attempts from public.test_attempts
    if (client) {
      try {
        const { data: attData, error: attErr } = await client
          .from('test_attempts')
          .select('id, test_id, user_id, candidate_name, roll_number, total_score, accuracy, time_taken_seconds, created_at, responses')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (!attErr && attData) {
          attemptsList = attData;
        }
      } catch (e) {
        console.warn('Could not fetch test_attempts from Supabase:', e);
      }
    }

    // 4. Guarantee EVERY student who took a test (including the friend) appears in candidatesList
    attemptsList.forEach(a => {
      const candidateKey = a.user_id || a.candidate_name;
      if (!candidateKey) return;

      // Find matching candidate by user_id or name
      let foundCandidate = candidatesMap.get(a.user_id);
      if (!foundCandidate) {
        for (const [_, c] of candidatesMap) {
          if (c.name === a.candidate_name || (a.roll_number && c.rollNumber === a.roll_number)) {
            foundCandidate = c;
            break;
          }
        }
      }

      const timeTaken = Number(a.time_taken_seconds) || 0;

      if (foundCandidate) {
        foundCandidate.totalTimeSpentSeconds = (foundCandidate.totalTimeSpentSeconds || 0) + timeTaken;
        foundCandidate.attemptsCount = Math.max(foundCandidate.attemptsCount || 0, 1) + 1;
      } else {
        // Create candidate entry from attempt stream
        candidatesMap.set(candidateKey, {
          id: a.user_id || `att_user_${Math.random().toString(36).substring(2, 6)}`,
          name: a.candidate_name || 'Aspirant',
          email: 'N/A',
          phone: 'N/A',
          rollNumber: a.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
          category: 'UR',
          attemptsCount: 1,
          savedQuestionsCount: 0,
          totalTimeSpentSeconds: timeTaken,
          createdAt: a.created_at,
          lastSignInAt: a.created_at
        });
      }
    });

    const candidatesList = Array.from(candidatesMap.values());
    candidatesList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // 5. Hourly Activity Distribution (00:00 to 23:00)
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

    // 6. Day-wise Activity (last 14 days)
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

    // 7. Unique Shift Submissions from Answer Key Calculator
    const uniqueShifts = getUniqueShiftSubmissions();

    // 8. Question Reports (from Supabase first, merged with local JSON)
    const reportsMap = new Map<string, any>();
    if (client) {
      try {
        const { data: dbReports, error: rErr } = await client
          .from('question_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (!rErr && Array.isArray(dbReports)) {
          dbReports.forEach(r => {
            reportsMap.set(r.id, {
              id: r.id,
              testId: r.test_id,
              testTitle: r.test_title || 'CBT Mock Test',
              qno: Number(r.question_number) || 1,
              questionText: r.question_text || '',
              issueType: r.issue_type || 'wrong_answer',
              description: r.description || '',
              userEmail: r.user_email,
              userId: r.user_id,
              status: r.status || 'pending',
              createdAt: r.created_at
            });
          });
        }
      } catch (e) {
        console.warn('Supabase question_reports fetch note:', e);
      }
    }

    try {
      if (fs.existsSync(REPORTS_FILE)) {
        const fileData = JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
        if (Array.isArray(fileData)) {
          fileData.forEach(r => {
            if (!reportsMap.has(r.id)) reportsMap.set(r.id, r);
          });
        }
      }
    } catch {}

    const questionReports = Array.from(reportsMap.values());
    questionReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 9. Student Reviews
    let studentReviews: any[] = [];
    if (client) {
      try {
        const { data: revData } = await client
          .from('student_reviews')
          .select('*')
          .order('order_index', { ascending: true });
        if (Array.isArray(revData)) studentReviews = revData;
      } catch {}
    }
    if (studentReviews.length === 0) {
      try {
        if (fs.existsSync(REVIEWS_FILE)) {
          const revJson = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
          if (Array.isArray(revJson)) studentReviews = revJson;
        }
      } catch {}
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
        totalReviewsCount: studentReviews.length,
        uniqueShiftsCount: uniqueShifts.length,
        databaseConnected: Boolean(supabaseAdmin || supabase)
      },
      candidates: candidatesList,
      attempts: attemptsList.map(a => ({
        id: a.id,
        testId: a.test_id,
        candidateName: a.candidate_name,
        rollNumber: a.roll_number,
        score: Number(a.total_score) || 0,
        accuracy: Number(a.accuracy) || 0,
        timeTakenSeconds: Number(a.time_taken_seconds) || 0,
        createdAt: a.created_at
      })),
      hourlyActivity,
      dayWiseActivity,
      uniqueShifts,
      shiftDifficultyAnalytics: computeShiftDifficultyAnalytics(),
      questionReports,
      studentReviews
    });
  } catch (err: any) {
    console.error('API /admin/dashboard error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error loading admin dashboard' },
      { status: 500 }
    );
  }
}
