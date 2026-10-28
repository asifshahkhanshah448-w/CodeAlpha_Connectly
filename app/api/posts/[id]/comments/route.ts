import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const currentUserId = token ? verifyJWT(token) : null;

    const comments = await dataStore.getComments(id, currentUserId);
    return NextResponse.json({
      success: true,
      comments,
      count: comments.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching comments';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'Comment content cannot be empty' },
        { status: 400 }
      );
    }

    const comment = await dataStore.addComment(id, userId, content);
    return NextResponse.json({
      success: true,
      message: 'Comment added successfully!',
      comment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error adding comment';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
