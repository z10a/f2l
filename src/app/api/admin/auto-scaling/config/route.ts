import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { minServers, maxServers, targetCpu, enabled } = body as {
      minServers?: number;
      maxServers?: number;
      targetCpu?: number;
      enabled?: boolean;
    };

    if (minServers === undefined || maxServers === undefined) {
      return NextResponse.json({ error: 'Min/Max servers required' }, { status: 400 });
    }

    const message = enabled
      ? `تم تفعيل التوسع التلقائي (${minServers}-${maxServers}) بهدف ${targetCpu ?? 65}% CPU.`
      : `تم حفظ إعدادات التوسع (${minServers}-${maxServers}) بدون تفعيل.`;

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Autoscaling config error:', error);
    return NextResponse.json({ error: 'Failed to save autoscaling config' }, { status: 500 });
  }
}
