import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REVIEWS_FILE = path.join(process.cwd(), 'src', 'storage', 'student-reviews.json');

const INITIAL_DUMMY_REVIEWS = [
  {
    id: 'rev_1',
    student_name: 'Aaditya Ranjan',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    exam_title: 'SSC CGL 2025 Tier-1 (Score: 172.5)',
    review_category: 'Mock Test Interface',
    rating: 5,
    review_text: 'The exact TCS exam interface simulation gave me immense exam-hall confidence. The sectional locks and timer sync mirrored the real CBT shift down to milliseconds.',
    is_published: true,
    order_index: 1,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'rev_2',
    student_name: 'Priya Sharma',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    exam_title: 'RRB NTPC Graduate Level (Selected)',
    review_category: 'Question Quality',
    rating: 5,
    review_text: 'Question explanations with step-by-step KaTeX mathematical equations and bilingual Hindi translations helped me resolve my doubts without needing separate coaching books.',
    is_published: true,
    order_index: 2,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'rev_3',
    student_name: 'Rahul Kumar Verma',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    exam_title: 'RRB ALP 2025-26 Aspirant',
    review_category: 'Performance Analysis',
    rating: 5,
    review_text: 'The normalization delta matrix and shift-wise difficulty audits accurately predicted my percentile. The best mock analysis portal for railway aspirants.',
    is_published: true,
    order_index: 3,
    created_at: new Date(Date.now() - 11 * 86400000).toISOString()
  },
  {
    id: 'rev_4',
    student_name: 'Neha Gupta',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    exam_title: 'SSC CHSL 2025 Tier-1 Qualified',
    review_category: 'Website Experience',
    rating: 5,
    review_text: 'Lightning fast speed with zero lag during tests. The answer key calculator parsed my response sheet in just 3 seconds with exact negative marking breakdown.',
    is_published: true,
    order_index: 4,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'rev_5',
    student_name: 'Vikram Singh Chauhan',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    exam_title: 'RRB Group D & NTPC Aspirant',
    review_category: 'Question Quality',
    rating: 5,
    review_text: 'Having real 2024 and 2025 Eduquity & TCS questions with verified answer keys saved hundreds of hours of wandering on Telegram groups.',
    is_published: true,
    order_index: 5,
    created_at: new Date(Date.now() - 18 * 86400000).toISOString()
  },
  {
    id: 'rev_6',
    student_name: 'Ananya Sen',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    exam_title: 'SSC MTS 2025 (Session 1 & 2)',
    review_category: 'Mock Test Interface',
    rating: 5,
    review_text: 'MTS two-session qualifying rules and negative marking criteria were implemented 100% accurately as per the official SSC notification.',
    is_published: true,
    order_index: 6,
    created_at: new Date(Date.now() - 22 * 86400000).toISOString()
  }
];

function loadLocalReviews(): any[] {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch (e) {}
  return INITIAL_DUMMY_REVIEWS;
}

function saveLocalReviews(reviews: any[]) {
  try {
    const dir = path.dirname(REVIEWS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (e) {}
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true'; // Admin sees all, public sees published

    const client = supabaseAdmin || supabase;
    let reviews: any[] = [];

    if (client) {
      try {
        let query = client.from('student_reviews').select('*').order('order_index', { ascending: true });
        if (!all) query = query.eq('is_published', true);

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          reviews = data;
        }
      } catch (e) {
        console.warn('Supabase student_reviews fetch note:', e);
      }
    }

    if (reviews.length === 0) {
      reviews = loadLocalReviews();
      if (!all) {
        reviews = reviews.filter(r => r.is_published);
      }
    }

    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      student_name,
      avatar_url,
      exam_title,
      review_category,
      rating,
      review_text,
      is_published,
      order_index
    } = body;

    if (!student_name || !review_text || !exam_title) {
      return NextResponse.json(
        { success: false, error: 'Student name, exam title, and review text are required' },
        { status: 400 }
      );
    }

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      student_name,
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      exam_title,
      review_category: review_category || 'Website Experience',
      rating: Number(rating) || 5,
      review_text,
      is_published: is_published !== false,
      order_index: Number(order_index) || 0,
      created_at: new Date().toISOString()
    };

    // 1. Supabase
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client.from('student_reviews').insert(newReview);
      } catch (e: any) {
        console.warn('Supabase insert review note:', e.message);
      }
    }

    // 2. Local fallback
    const local = loadLocalReviews();
    local.unshift(newReview);
    saveLocalReviews(local);

    return NextResponse.json({ success: true, review: newReview });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Review id is required' }, { status: 400 });
    }

    // 1. Supabase
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client.from('student_reviews').update(updates).eq('id', id);
      } catch (e: any) {
        console.warn('Supabase update review note:', e.message);
      }
    }

    // 2. Local fallback
    const local = loadLocalReviews();
    const target = local.find(r => r.id === id);
    if (target) {
      Object.assign(target, updates);
      saveLocalReviews(local);
    }

    return NextResponse.json({ success: true, review: target || { id, ...updates } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Review id is required' }, { status: 400 });
    }

    // 1. Supabase
    const client = supabaseAdmin || supabase;
    if (client) {
      try {
        await client.from('student_reviews').delete().eq('id', id);
      } catch (e: any) {
        console.warn('Supabase delete review note:', e.message);
      }
    }

    // 2. Local fallback
    const local = loadLocalReviews().filter(r => r.id !== id);
    saveLocalReviews(local);

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
