import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { emailOrPhone, newPassword } = await req.json();

    if (!emailOrPhone || !newPassword) {
      return NextResponse.json(
        { error: 'Email or Mobile Number and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const input = emailOrPhone.trim();
    const cleanPhone = input.replace(/\D/g, '');
    const isEmail = input.includes('@');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Authentication service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // List users to locate by email or phone
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    
    if (listError || !usersData?.users) {
      return NextResponse.json(
        { error: 'Unable to verify candidate records at this moment.' },
        { status: 500 }
      );
    }

    const matchedUser = usersData.users.find(u => {
      if (isEmail && u.email?.toLowerCase() === input.toLowerCase()) {
        return true;
      }
      const meta = u.user_metadata || {};
      const userPhone = meta.phone ? String(meta.phone).replace(/\D/g, '') : '';
      if (cleanPhone.length >= 10 && userPhone === cleanPhone) {
        return true;
      }
      return false;
    });

    if (!matchedUser) {
      return NextResponse.json(
        { error: 'No candidate account found matching this email or mobile number. Please check or register a new account.' },
        { status: 404 }
      );
    }

    // Directly reset password and mark email confirmed so user can login immediately without link verification
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      matchedUser.id,
      {
        password: newPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully updated! You can now sign in with your new password.'
    });

  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred while resetting password.' },
      { status: 500 }
    );
  }
}
