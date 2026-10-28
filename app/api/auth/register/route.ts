import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, name, bio, avatar, location, website } = body;

    if (!username || !email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Please provide username, email, password, and display name.' },
        { status: 400 }
      );
    }

    const { token, user } = await dataStore.register({
      username,
      email,
      password,
      name,
      bio,
      avatar,
      location,
      website,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      token,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed.';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
