import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const list = await db.favoriteList.findUnique({
      where: { id: params.listId },
      include: {
        items: true,
      },
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error('Error fetching favorite list:', error);
    return NextResponse.json({ error: 'Failed to fetch favorite list' }, { status: 500 });
  }
}
