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
    const userId = verifyJWT(token);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }

    const result = await dataStore.toggleLike(id, userId);
    return NextResponse.json({
      success: true,
      message: result.isLiked ? 'Post liked' : 'Post unliked',
      likesCount: result.likesCount,
      isLiked: result.isLiked,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error liking post';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(req, { params });
}
