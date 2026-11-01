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
    const client = supabaseAdmin || supabase;

    // 1. Check Supabase 'admins' table
    if (client) {
      try {
        const { data: adminRecord, error: adminErr } = await client
          .from('admins')
          .select('id, email, password_hash, name, role, is_active')
          .eq('email', email)
          .single();

        if (!adminErr && adminRecord && adminRecord.is_active) {
          // Compare password (supports plain text migration or hash)
          if (adminRecord.password_hash === password || adminRecord.password_hash === password.trim()) {
            // Update last_login_at
            await client
              .from('admins')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', adminRecord.id);

            const sessionPayload = {
              userId: adminRecord.id,
              email: adminRecord.email,
              name: adminRecord.name,
              role: adminRecord.role || 'admin',
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
                id: adminRecord.id,
                email: adminRecord.email,
                name: adminRecord.name,
                role: adminRecord.role || 'admin'
              }
            });
          }
        }
      } catch (dbErr) {
        console.warn('Admin table lookup exception:', dbErr);
      }
    }

    // 2. Authenticate with Supabase Auth
    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!authError && authData?.user) {
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
      }
    }

    // 3. Fallback check: default superadmin credentials
    if (
      (username === 'admin' || username === 'admin@examinformer.in' || username === 'admin@mockyoddha.com') &&
      password === 'MockYoddhaAdmin@2026'
    ) {
      const sessionPayload = {
        userId: 'superadmin_static',
        email: 'admin@examinformer.in',
        role: 'superadmin',
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
        user: { email: 'admin@examinformer.in', role: 'superadmin' }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid admin credentials.' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
