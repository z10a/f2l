import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl.searchParams;
  const ids = searchParams.get('ids');
  
  if (!ids || ids.split(',').filter(id => id.trim() === '').length === 0) {
    return NextResponse.json({ error: 'No stream IDs provided' });
  }

  const streamIds = ids.split(',').map(id => id.trim());
  
  try {
    const streams = await db.stream.findMany({
      where: {
        id: { in: streamIds }
      }
    });

    // Check each stream's URL status
    const results = await Promise.all(streams.map(async (stream) => {
      try {
        const response = await fetch(stream.url, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        const isOnline = response.ok;
        const lastCheckedAt = new Date();
        const statusCheckedAt = new Date();

        // Add status to database (this is a temporary check)
        if (stream.id) {
          await db.stream.update({
            where: { id: stream.id },
            data: {
              status: isOnline ? 'online' : 'offline',
              statusCheckedAt: isOnline ? lastCheckedAt : statusCheckedAt
            }
          });
        }

        return {
          id: stream.id,
          status: isOnline ? 'online' : 'offline',
          lastCheckedAt: isOnline ? lastCheckedAt.toISOString() : statusCheckedAt.toISOString()
        };
      } catch (error) {
        console.error(`Error checking stream ${stream.id}:`, error);
        return {
          id: stream.id,
          status: 'unknown',
          lastCheckedAt: null
        };
      }
    }));

    const resultsWithStatus = await Promise.all(results);

    return NextResponse.json({ results: resultsWithStatus });
  } catch (error) {
    console.error('Error checking streams:', error);
    return NextResponse.json({ error: 'Failed to check streams' });
  }
}