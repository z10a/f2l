import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface BulkCreateChannel {
  id?: string;
  name: string;
  url: string;
  logo?: string;
  tvgId?: string;
  group?: string;
}

/**
 * Bulk create streams from selected channels
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channels, authorId, playlistName } = body;

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json(
        { error: 'No channels provided' },
        { status: 400 }
      );
    }

    if (!authorId) {
      return NextResponse.json(
        { error: 'Author ID is required' },
        { status: 400 }
      );
    }

    // Validate author exists
    const author = await db.user.findUnique({
      where: { id: authorId },
    });

    if (!author) {
      return NextResponse.json(
        { error: `Author with ID "${authorId}" not found in database` },
        { status: 404 }
      );
    }

    console.log(`Creating streams for ${channels.length} channels as author: ${author.name || author.email} (${authorId})`);

    const createdStreams = [];
    const errors = [];

    // Create streams in bulk
    for (const channel of channels as BulkCreateChannel[]) {
      try {
        // Create a new stream for each channel
        const stream = await db.stream.create({
          data: {
            title: channel.name,
            description: channel.group ? `Category: ${channel.group}` : undefined,
            thumbnail: channel.logo,
            published: true,
            authorId: authorId,
          },
        });

        // Create server for the stream
        const server = await db.server.create({
          data: {
            streamId: stream.id,
            name: 'Default Server',
            url: channel.url,
            priority: 0,
            channelId: channel.id,
            channelName: channel.name,
            channelLogo: channel.logo,
            tvgId: channel.tvgId,
          },
        });

        createdStreams.push({
          streamId: stream.id,
          channelId: channel.id,
          channelName: channel.name,
          serverId: server.id,
        });
      } catch (error) {
        console.error(`Error creating stream for channel ${channel.name}:`, error);
        errors.push({
          channelId: channel.id,
          channelName: channel.name,
          error: error instanceof Error ? error.message : 'Failed to create stream',
        });
      }
    }

    console.log(`Bulk create complete: ${createdStreams.length} created, ${errors.length} failed`);

    return NextResponse.json({
      success: true,
      created: createdStreams.length,
      failed: errors.length,
      streams: createdStreams,
      errors,
    });
  } catch (error) {
    console.error('Error in bulk create:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to bulk create streams' },
      { status: 500 }
    );
  }
}
