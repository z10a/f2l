import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { strategy, healthCheckUrl, autoFailover } = body as {
      strategy?: string;
      healthCheckUrl?: string;
      autoFailover?: boolean;
    };

    if (!strategy) {
      return NextResponse.json({ error: 'Strategy is required' }, { status: 400 });
    }

    const message = `تم حفظ استراتيجية ${strategy}${
      healthCheckUrl ? ` مع فحص صحة على ${healthCheckUrl}` : ''
    }${autoFailover ? ' وتبديل تلقائي.' : '.'}`;

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Load balancing config error:', error);
    return NextResponse.json({ error: 'Failed to save load balancing config' }, { status: 500 });
  }
}
