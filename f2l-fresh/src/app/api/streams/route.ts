import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all streams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');

    const streams = await db.stream.findMany({
      where: published ? { published: published === 'true' } : undefined,
      include: {
        servers: {
          orderBy: { priority: 'asc' }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(streams);
  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streams' },
      { status: 500 }
    );
  }
}

// POST create new stream
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, thumbnail, categoryId, published, authorId, playlistUrl } = body;

    const stream = await db.stream.create({
      data: {
        title,
        description,
        thumbnail,
        categoryId,
        published,
        authorId,
        playlistUrl
      },
      include: {
        servers: true
      }
    });

    return NextResponse.json(stream, { status: 201 });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    );
  }
}
