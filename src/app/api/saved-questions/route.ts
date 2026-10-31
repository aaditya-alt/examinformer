import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, savedQuestions: [] });
    }

    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !userData?.user) {
      return NextResponse.json({ success: true, savedQuestions: [] });
    }

    const savedQuestions = userData.user.user_metadata?.saved_questions || [];

    return NextResponse.json({
      success: true,
      savedQuestions
    });
  } catch (err: any) {
    console.error('API /saved-questions GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error fetching saved questions' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, question } = body;

    if (!userId || !question || !question.questionId) {
      return NextResponse.json(
        { error: 'userId and question payload with questionId are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Saved locally (Supabase admin not configured)',
        savedQuestions: [question]
      });
    }

    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !userData?.user) {
      return NextResponse.json(
        { error: 'Candidate account not found in database' },
        { status: 404 }
      );
    }

    const currentMeta = userData.user.user_metadata || {};
    const existingSaved: any[] = currentMeta.saved_questions || [];

    // Check if already saved; if so, update it, otherwise prepend
    const existingIndex = existingSaved.findIndex(
      (q: any) => q.questionId === question.questionId
    );

    let updatedList: any[];
    if (existingIndex >= 0) {
      updatedList = [...existingSaved];
      updatedList[existingIndex] = { ...question, savedAt: new Date().toISOString() };
    } else {
      updatedList = [{ ...question, savedAt: new Date().toISOString() }, ...existingSaved];
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...currentMeta,
        saved_questions: updatedList
      }
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      savedQuestions: updatedList
    });
  } catch (err: any) {
    console.error('API /saved-questions POST error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error saving question' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const questionId = searchParams.get('questionId');

    if (!userId || !questionId) {
      return NextResponse.json(
        { error: 'userId and questionId are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ success: true, savedQuestions: [] });
    }

    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !userData?.user) {
      return NextResponse.json({ success: true, savedQuestions: [] });
    }

    const currentMeta = userData.user.user_metadata || {};
    const existingSaved: any[] = currentMeta.saved_questions || [];

    const updatedList = existingSaved.filter((q: any) => q.questionId !== questionId);

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...currentMeta,
        saved_questions: updatedList
      }
    });

    return NextResponse.json({
      success: true,
      savedQuestions: updatedList
    });
  } catch (err: any) {
    console.error('API /saved-questions DELETE error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error deleting saved question' },
      { status: 500 }
    );
  }
}
