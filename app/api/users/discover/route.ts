import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const currentUserId = token ? verifyJWT(token) : null;

    const users = await dataStore.discoverUsers(currentUserId);
    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error discovering users';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
