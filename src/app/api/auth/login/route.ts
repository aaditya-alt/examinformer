import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      );
    }

    const input = emailOrPhone.trim();
    const isEmail = input.includes('@');
    let targetEmail = input.toLowerCase();

    // If input is phone number, locate user by phone in Supabase user metadata
    if (!isEmail && supabaseAdmin) {
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        if (usersData?.users) {
          const matched = usersData.users.find(u => {
            const meta = u.user_metadata || {};
            return meta.phone === input || meta.phone?.replace(/\D/g, '') === input.replace(/\D/g, '');
          });
          if (matched && matched.email) {
            targetEmail = matched.email;
          }
        }
      } catch (e) {
        console.warn('Could not list users for phone lookup:', e);
      }
    }

    // Attempt sign in with Supabase client
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password
      });

      if (!error && data.user) {
        const meta = data.user.user_metadata || {};
        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: meta.full_name || meta.name || targetEmail.split('@')[0],
            phone: meta.phone || (isEmail ? '' : input),
            rollNumber: meta.roll_number || '2402' + Math.floor(100000 + Math.random() * 900000),
            category: meta.category || 'UR',
            createdAt: data.user.created_at
          }
        });
      }

      if (error) {
        return NextResponse.json(
          { error: 'Invalid email/phone or password. Please check your credentials.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Authentication service temporarily unavailable' },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during login' },
      { status: 500 }
    );
  }
}
