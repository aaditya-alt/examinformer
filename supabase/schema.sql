-- ====================================================================
-- SUPABASE SCHEMA FOR MOCK MATRIX / EXAM PREP PLATFORM
-- Covers: Exam Management, Answer Key Ingestion, Score Calculator,
-- Rank Engine, CBT Mock Test Series, and Admin Pipeline.
-- Compatible with both UUIDs and custom string slugs.
-- ====================================================================

-- 1. EXAMS & CATEGORIES
CREATE TABLE IF NOT EXISTS public.exams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'ssc-cgl', 'rrb-ntpc', 'ssc-chsl'
    title VARCHAR(150) NOT NULL,
    family VARCHAR(50) NOT NULL, -- 'ssc', 'rrb', 'banking', 'state'
    description TEXT,
    logo_url TEXT,
    marks_per_correct NUMERIC(5,2) DEFAULT 2.00,
    negative_per_wrong NUMERIC(5,2) DEFAULT 0.50,
    total_time_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ANSWER KEY SUBMISSIONS (Ingested from students entering URLs)
CREATE TABLE IF NOT EXISTS public.answer_key_submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT REFERENCES public.exams(id) ON DELETE SET NULL,
    exam_code VARCHAR(50) NOT NULL,
    exam_family VARCHAR(50) NOT NULL, -- 'ssc', 'rrb', 'other'
    source_url TEXT,
    
    -- Candidate extracted metadata
    roll_number VARCHAR(100),
    candidate_name VARCHAR(150),
    registration_number VARCHAR(100),
    category VARCHAR(50) DEFAULT 'UR', -- UR, OBC, EWS, SC, ST, ESM, PWD
    state_zone VARCHAR(100),
    exam_date VARCHAR(50),
    shift_time VARCHAR(100),
    venue_name TEXT,
    
    -- Calculated Score & Performance
    total_questions INTEGER DEFAULT 0,
    attempted INTEGER DEFAULT 0,
    correct INTEGER DEFAULT 0,
    wrong INTEGER DEFAULT 0,
    skipped INTEGER DEFAULT 0,
    bonus INTEGER DEFAULT 0,
    raw_score NUMERIC(7,2) DEFAULT 0,
    negative_marks NUMERIC(7,2) DEFAULT 0,
    final_score NUMERIC(7,2) DEFAULT 0,
    accuracy_percentage NUMERIC(5,2) DEFAULT 0,
    
    -- Detailed section breakdowns & full extracted questions
    sections_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Admin Ingestion status
    status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'pushed_to_test', 'archived'
    pushed_test_id TEXT,
    
    ip_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for rapid rank calculations
CREATE INDEX IF NOT EXISTS idx_submissions_exam_score ON public.answer_key_submissions (exam_code, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_shift ON public.answer_key_submissions (exam_code, exam_date, shift_time);
CREATE INDEX IF NOT EXISTS idx_submissions_category ON public.answer_key_submissions (exam_code, category);

-- 3. MOCK TESTS (Created natively or pushed from answer keys)
CREATE TABLE IF NOT EXISTS public.tests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    exam_id TEXT REFERENCES public.exams(id) ON DELETE SET NULL,
    exam_code VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) DEFAULT 'pyq', -- 'pyq', 'full_mock', 'sectional', 'live'
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    total_marks NUMERIC(7,2) DEFAULT 200,
    total_questions INTEGER DEFAULT 100,
    source_answer_key_id TEXT REFERENCES public.answer_key_submissions(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TEST SECTIONS
CREATE TABLE IF NOT EXISTS public.test_sections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    test_id TEXT REFERENCES public.tests(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. "General Intelligence and Reasoning"
    order_index INTEGER DEFAULT 0,
    marks_per_question NUMERIC(5,2) DEFAULT 2.0,
    negative_marks NUMERIC(5,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. QUESTIONS BANK
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    test_id TEXT REFERENCES public.tests(id) ON DELETE CASCADE,
    section_id TEXT REFERENCES public.test_sections(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_id_str VARCHAR(100), -- original TCS question ID e.g. 4410091631384
    question_text_en TEXT,
    question_text_hi TEXT,
    question_images TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Options: [{ id: 1, text_en: "...", text_hi: "...", image_url: "...", is_correct: true }]
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_option_index INTEGER, -- 1, 2, 3, or 4
    
    explanation_en TEXT,
    explanation_hi TEXT,
    is_bonus BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. STUDENT TEST ATTEMPTS
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    test_id TEXT REFERENCES public.tests(id) ON DELETE CASCADE,
    user_id TEXT, -- nullable for guest attempts
    candidate_name VARCHAR(150) DEFAULT 'Student',
    
    -- Answers record: { [question_id]: { chosen_option: 2, time_spent_sec: 45, status: "answered" } }
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    total_score NUMERIC(7,2) DEFAULT 0,
    accuracy NUMERIC(5,2) DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed', -- 'in_progress', 'completed'
    
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ENABLE ROW LEVEL SECURITY & PUBLIC ACCESS POLICIES
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_key_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Allow public read & insert policies for seamless student access
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read on exams" ON public.exams;
    CREATE POLICY "Allow public read on exams" ON public.exams FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public read on tests" ON public.tests;
    CREATE POLICY "Allow public read on tests" ON public.tests FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public read on test_sections" ON public.test_sections;
    CREATE POLICY "Allow public read on test_sections" ON public.test_sections FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public read on questions" ON public.questions;
    CREATE POLICY "Allow public read on questions" ON public.questions FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Allow public insert & read on submissions" ON public.answer_key_submissions;
    CREATE POLICY "Allow public insert & read on submissions" ON public.answer_key_submissions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public insert on attempts" ON public.test_attempts;
    CREATE POLICY "Allow public insert on attempts" ON public.test_attempts FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 8. SEED INITIAL EXAMS
INSERT INTO public.exams (code, title, family, marks_per_correct, negative_per_wrong, total_time_minutes)
VALUES
    ('ssc-cgl', 'SSC CGL (Tier 1)', 'ssc', 2.00, 0.50, 60),
    ('ssc-chsl', 'SSC CHSL (Tier 1)', 'ssc', 2.00, 0.50, 60),
    ('ssc-mts', 'SSC MTS & Havaldar', 'ssc', 3.00, 1.00, 90),
    ('ssc-gd', 'SSC GD Constable', 'ssc', 2.00, 0.50, 60),
    ('rrb-ntpc', 'RRB NTPC (CBT-1)', 'rrb', 1.00, 0.33, 90),
    ('rrb-group-d', 'RRB Group D', 'rrb', 1.00, 0.33, 90),
    ('rrb-alp', 'RRB ALP (Assistant Loco Pilot)', 'rrb', 1.00, 0.33, 60)
ON CONFLICT (code) DO NOTHING;
