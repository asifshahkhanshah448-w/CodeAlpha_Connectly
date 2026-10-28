import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, dataStore } from '@/lib/store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const tab = searchParams.get('tab') || 'all';
    const tag = searchParams.get('tag') || undefined;

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const currentUserId = token ? verifyJWT(token) : null;

    const result = await dataStore.getFeed({
      page,
      limit,
      tab,
      tag,
      currentUserId,
    });

    return NextResponse.json({
      success: true,
      posts: result.posts,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch posts';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const { content, image } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'Post content cannot be empty' },
        { status: 400 }
      );
    }

    const post = await dataStore.createPost(userId, content, image);

    return NextResponse.json({
      success: true,
      message: 'Post created successfully!',
      post,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
