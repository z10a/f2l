import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerKey = searchParams.get('ownerKey');

    if (!ownerKey) {
      return NextResponse.json({ error: 'ownerKey is required' }, { status: 400 });
    }

    const lists = await db.favoriteList.findMany({
      where: { ownerKey },
      include: {
        items: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching favorite lists:', error);
    return NextResponse.json({ error: 'Failed to fetch favorite lists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ownerKey, name } = body;

    if (!ownerKey || !name) {
      return NextResponse.json({ error: 'ownerKey and name are required' }, { status: 400 });
    }

    const list = await db.favoriteList.create({
      data: {
        ownerKey,
        name,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Error creating favorite list:', error);
    return NextResponse.json({ error: 'Failed to create favorite list' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { listId, name, streamIds } = body as {
      listId?: string;
      name?: string;
      streamIds?: string[];
    };

    if (!listId) {
      return NextResponse.json({ error: 'listId is required' }, { status: 400 });
    }

    const updated = await db.favoriteList.update({
      where: { id: listId },
      data: {
        name,
        items: streamIds
          ? {
              deleteMany: {},
              createMany: {
                data: streamIds.map((streamId) => ({ streamId })),
              },
            }
          : undefined,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating favorite list:', error);
    return NextResponse.json({ error: 'Failed to update favorite list' }, { status: 500 });
  }
}
