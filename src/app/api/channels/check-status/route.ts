import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type StatusResult = {
  streamId: string;
  status: 'working' | 'broken';
  statusCode?: number;
  error?: string;
};

const CHECK_TIMEOUT_MS = 8000;

const checkUrl = async (url: string): Promise<{ status: 'working' | 'broken'; statusCode?: number; error?: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChannelStatus/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return { status: 'working', statusCode: response.status };
    }

    return { status: 'broken', statusCode: response.status };
  } catch (error) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChannelStatus/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { status: 'working', statusCode: response.status };
      }

      return { status: 'broken', statusCode: response.status };
    } catch (fallbackError) {
      return {
        status: 'broken',
        error: fallbackError instanceof Error ? fallbackError.message : 'Connection failed',
      };
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const streamIds = Array.isArray(body.streamIds) ? body.streamIds : [];

    if (streamIds.length === 0) {
      return NextResponse.json({ error: 'No stream IDs provided' }, { status: 400 });
    }

    const streams = await db.stream.findMany({
      where: { id: { in: streamIds } },
      include: {
        servers: {
          orderBy: { priority: 'asc' },
        },
      },
    });

    const results: StatusResult[] = await Promise.all(
      streams.map(async (stream) => {
        const primaryServer = stream.servers[0];
        if (!primaryServer?.url) {
          return { streamId: stream.id, status: 'broken', error: 'No server URL' };
        }
        const check = await checkUrl(primaryServer.url);
        return {
          streamId: stream.id,
          status: check.status,
          statusCode: check.statusCode,
          error: check.error,
        };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error checking channel status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    );
  }
}
