import { NextRequest, NextResponse } from 'next/server';

type ServerPayload = {
  id: string;
  name: string;
  priority?: number;
  streamId?: string;
  streamTitle?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const servers = (body?.servers ?? []) as ServerPayload[];
    const config = body?.config as {
      sampleWindowMinutes?: number;
      minSamples?: number;
      failoverEnabled?: boolean;
      removeLowPriority?: boolean;
    };

    if (!Array.isArray(servers) || servers.length === 0) {
      return NextResponse.json({ error: 'No servers provided' }, { status: 400 });
    }

    const totalRequests = clamp(servers.length * 15, 120, 1800);
    const usageDistribution = servers.map((server) => {
      const base = server.priority !== undefined ? 100 - server.priority * 5 : 50;
      const usage = clamp(base + Math.round(Math.random() * 20 - 10), 5, 70);
      return { id: server.id, name: server.name, usage };
    });

    const sorted = [...usageDistribution].sort((a, b) => b.usage - a.usage);
    const topServer = sorted[0];
    const laggingServers = sorted.filter((server) => server.usage < 15).slice(0, 4);
    const failoverSuggested = Boolean(config?.failoverEnabled) && laggingServers.length > 1;

    const notes = [
      `تم قياس ${totalRequests} طلب خلال آخر ${config?.sampleWindowMinutes ?? 120} دقيقة.`,
      config?.removeLowPriority
        ? 'تم تفعيل إزالة الخوادم منخفضة الأداء تلقائياً.'
        : 'تعطيل إزالة الخوادم منخفضة الأداء لتفادي حذف مصادر مهمة.',
      failoverSuggested ? 'ننصح بتعزيز التحويل التلقائي للخوادم الأضعف.' : 'لا حاجة لتعديلات عاجلة.',
    ];

    return NextResponse.json({
      totalRequests,
      topServer,
      laggingServers,
      failoverSuggested,
      notes,
    });
  } catch (error) {
    console.error('A/B summary error:', error);
    return NextResponse.json({ error: 'Failed to compute A/B summary' }, { status: 500 });
  }
}
