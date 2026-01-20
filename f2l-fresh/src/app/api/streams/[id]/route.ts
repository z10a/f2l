import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single stream by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const stream = await db.stream.findUnique({
      where: { id },
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
        },
        ads: {
          where: { active: true }
        }
      }
    });

    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stream);
  } catch (error) {
    console.error('Error fetching stream:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream' },
      { status: 500 }
    );
  }
}

// PUT update stream
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, description, thumbnail, categoryId, published, playlistUrl } = body;

    const stream = await db.stream.update({
      where: { id },
      data: {
        title,
        description,
        thumbnail,
        categoryId,
        published,
        playlistUrl
      },
      include: {
        servers: true
      }
    });

    return NextResponse.json(stream);
  } catch (error) {
    console.error('Error updating stream:', error);
    return NextResponse.json(
      { error: 'Failed to update stream' },
      { status: 500 }
    );
  }
}

// DELETE stream
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.stream.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Error deleting stream:', error);
    return NextResponse.json(
      { error: 'Failed to delete stream' },
      { status: 500 }
    );
  }
}
