import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const userId = verifyJWT(token);

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  const user = await dataStore.getUserById(userId);
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}
