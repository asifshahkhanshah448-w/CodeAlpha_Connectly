import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const users = await dataStore.searchUsers(q);
    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error searching users';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
