import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide email/username and password.' },
        { status: 400 }
      );
    }

    const { token, user } = await dataStore.login(identifier, password);

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid credentials.';
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
}
