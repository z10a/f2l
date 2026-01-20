import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST create new server
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamId, name, url, priority, channelId, channelName, channelLogo } = body;

    const server = await db.server.create({
      data: {
        streamId,
        name,
        url,
        priority: priority || 0,
        channelId,
        channelName,
        channelLogo
      }
    });

    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    console.error('Error creating server:', error);
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    );
  }
}

// PUT update server
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, url, priority } = body;

    const server = await db.server.update({
      where: { id },
      data: {
        name,
        url,
        priority
      }
    });

    return NextResponse.json(server);
  } catch (error) {
    console.error('Error updating server:', error);
    return NextResponse.json(
      { error: 'Failed to update server' },
      { status: 500 }
    );
  }
}

// DELETE server
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    await db.server.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Error deleting server:', error);
    return NextResponse.json(
      { error: 'Failed to delete server' },
      { status: 500 }
    );
  }
}
