import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryStreamId, duplicateStreamIds } = body as {
      primaryStreamId?: string;
      duplicateStreamIds?: string[];
    };

    if (!primaryStreamId || !duplicateStreamIds || duplicateStreamIds.length === 0) {
      return NextResponse.json(
        { error: 'primaryStreamId and duplicateStreamIds are required' },
        { status: 400 }
      );
    }

    const uniqueDuplicates = [...new Set(duplicateStreamIds)].filter(
      (id) => id !== primaryStreamId
    );

    if (uniqueDuplicates.length === 0) {
      return NextResponse.json(
        { error: 'No duplicates selected for merge' },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const updatedServers = await tx.server.updateMany({
        where: { streamId: { in: uniqueDuplicates } },
        data: { streamId: primaryStreamId },
      });

      const deletedStreams = await tx.stream.deleteMany({
        where: { id: { in: uniqueDuplicates } },
      });

      return {
        updatedServers: updatedServers.count,
        deletedStreams: deletedStreams.count,
      };
    });

    return NextResponse.json({
      mergedStreams: result.deletedStreams,
      movedServers: result.updatedServers,
    });
  } catch (error) {
    console.error('Error merging duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to merge duplicate streams' },
      { status: 500 }
    );
  }
}
