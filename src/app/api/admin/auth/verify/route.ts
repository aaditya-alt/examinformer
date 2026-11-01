import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('mockyoddha_admin_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
      if (decoded.role === 'admin') {
        return NextResponse.json({ authenticated: true, user: decoded });
      }
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
