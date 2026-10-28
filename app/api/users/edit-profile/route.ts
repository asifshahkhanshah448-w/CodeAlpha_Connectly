import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userId = verifyJWT(token);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const updated = await dataStore.updateProfile(userId, body);

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating profile';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
