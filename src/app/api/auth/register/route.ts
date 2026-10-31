import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone number, and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanName = name.trim();
    const rollNumber = '2402' + Math.floor(100000 + Math.random() * 900000);

    if (!supabaseAdmin) {
      // Local fallback if Supabase not reachable
      return NextResponse.json({
        success: true,
        user: {
          id: 'usr_' + Date.now(),
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          rollNumber,
          category: 'UR'
        }
      });
    }

    // Create user in Supabase Auth with auto-confirmed email (zero wait time for user)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: cleanName,
        full_name: cleanName,
        phone: cleanPhone,
        roll_number: rollNumber,
        category: 'UR',
        saved_questions: []
      }
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please sign in instead.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: cleanName,
        phone: cleanPhone,
        rollNumber,
        category: 'UR',
        createdAt: data.user.created_at
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
