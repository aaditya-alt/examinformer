import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username/Email and Password are required.' }, { status: 400 });
    }

    const email = username.includes('@') ? username.trim().toLowerCase() : `${username.trim().toLowerCase()}@examinformer.in`;

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      // Fallback check: default superadmin credentials
      if (
        (username === 'admin' || username === 'admin@examinformer.in' || username === 'admin@mockyoddha.com') &&
        password === 'MockYoddhaAdmin@2026'
      ) {
        const sessionPayload = {
          userId: 'superadmin_static',
          email: 'admin@examinformer.in',
          role: 'admin',
          authenticatedAt: Date.now()
        };
        const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');
        const cookieStore = await cookies();
        cookieStore.set('mockyoddha_admin_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        });

        return NextResponse.json({
          success: true,
          user: { email: 'admin@examinformer.in', role: 'admin' }
        });
      }

      return NextResponse.json({ success: false, error: 'Invalid admin credentials.' }, { status: 401 });
    }

    // Set secure HTTP-only cookie
    const sessionPayload = {
      userId: authData.user.id,
      email: authData.user.email,
      role: 'admin',
      authenticatedAt: Date.now()
    };
    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64');

    const cookieStore = await cookies();
    cookieStore.set('mockyoddha_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
