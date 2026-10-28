import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const currentUserId = verifyJWT(token);
    if (!currentUserId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const result = await dataStore.toggleFollow(currentUserId, id);
    return NextResponse.json({
      success: true,
      message: result.isFollowing ? 'Followed successfully' : 'Unfollowed successfully',
      isFollowing: result.isFollowing,
      targetFollowersCount: result.targetFollowersCount,
      currentUserFollowingCount: result.currentUserFollowingCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating follow status';
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params });
}
