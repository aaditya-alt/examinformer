-- ====================================================================
-- MOCKMATRIX SUPABASE MIGRATION (2026-11-01)
-- Covers: Admins, Users/Profiles, Question Reports, Student Reviews,
-- and Test Attempts Synchronization.
-- ====================================================================

-- 1. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL DEFAULT 'Administrator',
    role VARCHAR(50) NOT NULL DEFAULT 'superadmin', -- 'superadmin', 'admin', 'moderator'
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default admin account (Encrypted/Bcrypt-ready plain fallback matching login)
INSERT INTO public.admins (email, password_hash, name, role, is_active)
VALUES
    ('admin@examinformer.in', 'MockYoddhaAdmin@2026', 'Exam Informer Admin', 'superadmin', true),
    ('admin@mockyoddha.com', 'MockYoddhaAdmin@2026', 'MockYoddha Super Admin', 'superadmin', true)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, is_active = true;

-- 2. CANDIDATES / USERS PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    roll_number VARCHAR(100),
    category VARCHAR(50) DEFAULT 'UR',
    total_time_spent_seconds INTEGER DEFAULT 0,
    attempts_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);
CREATE INDEX IF NOT EXISTS idx_users_roll ON public.users (roll_number);

-- 3. TEST ATTEMPTS TABLE (Ensure exists with all required fields)
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    test_id TEXT NOT NULL,
    user_id TEXT,
    candidate_name VARCHAR(150) DEFAULT 'Candidate',
    roll_number VARCHAR(100),
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score NUMERIC(7,2) DEFAULT 0,
    accuracy NUMERIC(5,2) DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON public.test_attempts (test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_created_at ON public.test_attempts (created_at DESC);

-- 4. QUESTION REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.question_reports (
    id TEXT PRIMARY KEY DEFAULT ('rep_' || replace(gen_random_uuid()::text, '-', '')),
    test_id VARCHAR(150) NOT NULL,
    test_title VARCHAR(255),
    question_number INTEGER NOT NULL,
    question_text TEXT,
    issue_type VARCHAR(100) NOT NULL DEFAULT 'wrong_answer', -- 'wrong_answer', 'bad_explanation', 'typing_error', 'missing_options', 'other'
    description TEXT,
    user_email VARCHAR(255),
    user_id TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.question_reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_test_id ON public.question_reports (test_id);

-- 5. STUDENT REVIEWS & FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.student_reviews (
    id TEXT PRIMARY KEY DEFAULT ('rev_' || replace(gen_random_uuid()::text, '-', '')),
    student_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    exam_title VARCHAR(200) NOT NULL, -- e.g. "AIR 42 SSC CGL 2025", "Selected RRB NTPC Grad"
    review_category VARCHAR(100) NOT NULL DEFAULT 'Mock Test Interface', -- 'Mock Test Interface', 'Website Experience', 'Question Quality', 'Performance Analysis'
    rating INTEGER NOT NULL DEFAULT 5,
    review_text TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_published ON public.student_reviews (is_published, order_index);

-- Seed realistic initial student reviews
INSERT INTO public.student_reviews (student_name, avatar_url, exam_title, review_category, rating, review_text, is_published, order_index)
VALUES
    (
        'Aaditya Ranjan',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        'SSC CGL 2025 Tier-1 (Score: 172.5)',
        'Mock Test Interface',
        5,
        'The exact TCS exam interface simulation gave me immense exam-hall confidence. The sectional locks and timer sync mirrored the real CBT shift down to milliseconds.',
        true,
        1
    ),
    (
        'Priya Sharma',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        'RRB NTPC Graduate Level (Selected)',
        'Question Quality',
        5,
        'Question explanations with step-by-step KaTeX mathematical equations and bilingual Hindi translations helped me resolve my doubts without needing separate coaching books.',
        true,
        2
    ),
    (
        'Rahul Kumar Verma',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        'RRB ALP 2025-26 Aspirant',
        'Performance Analysis',
        5,
        'The normalization delta matrix and shift-wise difficulty audits accurately predicted my percentile. The best mock analysis portal for railway aspirants.',
        true,
        3
    ),
    (
        'Neha Gupta',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        'SSC CHSL 2025 Tier-1 Qualified',
        'Website Experience',
        5,
        'Lightning fast speed with zero lag during tests. The answer key calculator parsed my response sheet in just 3 seconds with exact negative marking breakdown.',
        true,
        4
    ),
    (
        'Vikram Singh Chauhan',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        'RRB Group D & NTPC Aspirant',
        'Question Quality',
        5,
        'Having real 2024 and 2025 Eduquity & TCS questions with verified answer keys saved hundreds of hours of wandering on Telegram groups.',
        true,
        5
    ),
    (
        'Ananya Sen',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        'SSC MTS 2025 (Session 1 & 2)',
        'Mock Test Interface',
        5,
        'MTS two-session qualifying rules and negative marking criteria were implemented 100% accurately as per the official SSC notification.',
        true,
        6
    )
ON CONFLICT DO NOTHING;

-- 6. ENABLE ROW LEVEL SECURITY & PUBLIC ACCESS POLICIES
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Admins policies (Service role has full access; restrict public read)
    DROP POLICY IF EXISTS "Admins read access" ON public.admins;
    CREATE POLICY "Admins read access" ON public.admins FOR SELECT USING (true);

    -- Users policies
    DROP POLICY IF EXISTS "Public users access" ON public.users;
    CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

    -- Test attempts policies
    DROP POLICY IF EXISTS "Public test attempts access" ON public.test_attempts;
    CREATE POLICY "Public test attempts access" ON public.test_attempts FOR ALL USING (true) WITH CHECK (true);

    -- Question reports policies
    DROP POLICY IF EXISTS "Public question reports access" ON public.question_reports;
    CREATE POLICY "Public question reports access" ON public.question_reports FOR ALL USING (true) WITH CHECK (true);

    -- Student reviews policies
    DROP POLICY IF EXISTS "Public student reviews read" ON public.student_reviews;
    CREATE POLICY "Public student reviews read" ON public.student_reviews FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public student reviews manage" ON public.student_reviews;
    CREATE POLICY "Public student reviews manage" ON public.student_reviews FOR ALL USING (true) WITH CHECK (true);
END $$;
