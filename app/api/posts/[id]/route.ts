import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function PUT(
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
    const { content, image } = body;

    const post = await dataStore.updatePost(id, userId, content, image);
    return NextResponse.json({ success: true, message: 'Post updated!', post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating post';
    const status = message.includes('Forbidden') ? 403 : message.includes('not found') ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function DELETE(
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

    await dataStore.deletePost(id, userId);
    return NextResponse.json({ success: true, message: 'Post deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting post';
    const status = message.includes('Forbidden') ? 403 : message.includes('not found') ? 404 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
