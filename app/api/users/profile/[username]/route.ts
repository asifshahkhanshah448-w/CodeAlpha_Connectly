import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const currentUserId = token ? verifyJWT(token) : null;

    const result = await dataStore.getUserByUsername(username, currentUserId);

    if (!result) {
      return NextResponse.json(
        { success: false, message: `User @${username} was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      posts: result.posts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching user profile';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
