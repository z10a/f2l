import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface HealthCheckResult {
  streamId: string;
  streamTitle: string;
  serverId: string;
  serverName: string;
  url: string;
  status: 'working' | 'broken' | 'pending';
  statusCode?: number;
  error?: string;
  checkTime: string;
}

interface StreamWithServers {
  id: string;
  title: string;
  servers: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

// Check a single URL
async function checkUrl(url: string): Promise<{ status: 'working' | 'broken'; statusCode?: number; error?: string }> {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      method: 'HEAD', // HEAD request is faster than GET
      signal: controller.signal,
      mode: 'no-cors', // Try without CORS first
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HealthCheck/1.0)',
      },
    });

    clearTimeout(timeoutId);

    // Check if response is okay (2xx or 3xx status codes)
    if (response.ok) {
      return { status: 'working', statusCode: response.status };
    } else {
      return { status: 'broken', statusCode: response.status };
    }
  } catch (error) {
    // If HEAD fails, try GET
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller2.signal,
        mode: 'no-cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HealthCheck/1.0)',
        },
      });

      clearTimeout(timeoutId2);

      if (response.ok) {
        return { status: 'working', statusCode: response.status };
      }
      return { status: 'broken', statusCode: response.status };
    } catch (error2) {
      return {
        status: 'broken',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkAll = false } = body;

    // Fetch all streams with their servers
    const streams = await db.stream.findMany({
      include: {
        servers: {
          orderBy: { priority: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) as unknown as StreamWithServers[];

    const results: HealthCheckResult[] = [];
    const serversToCheck: Array<{
      streamId: string;
      streamTitle: string;
      serverId: string;
      serverName: string;
      url: string;
    }> = [];

    // Collect all server URLs
    for (const stream of streams) {
      for (const server of stream.servers) {
        serversToCheck.push({
          streamId: stream.id,
          streamTitle: stream.title,
          serverId: server.id,
          serverName: server.name,
          url: server.url,
        });
      }
    }

    // Check URLs in batches (concurrency control)
    const batchSize = 20; // Check 20 URLs at a time
    const batches: typeof serversToCheck[][] = [];

    for (let i = 0; i < serversToCheck.length; i += batchSize) {
      batches.push(serversToCheck.slice(i, i + batchSize));
    }

    // Process batches
    for (const batch of batches) {
      const batchPromises = batch.map(async (server) => {
        const checkResult = await checkUrl(server.url);
        return {
          streamId: server.streamId,
          streamTitle: server.streamTitle,
          serverId: server.serverId,
          serverName: server.serverName,
          url: server.url,
          status: checkResult.status,
          statusCode: checkResult.statusCode,
          error: checkResult.error,
          checkTime: new Date().toISOString(),
        } as HealthCheckResult;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Calculate statistics
    const working = results.filter(r => r.status === 'working').length;
    const broken = results.filter(r => r.status === 'broken').length;
    const total = results.length;

    return NextResponse.json({
      success: true,
      results,
      stats: {
        total,
        working,
        broken,
        workingRate: ((working / total) * 100).toFixed(1),
      },
      summary: {
        totalStreams: streams.length,
        totalServers: serversToCheck.length,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in health check:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Health check failed',
        results: [],
      },
      { status: 500 }
    );
  }
}
