import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const payload = {
      range: '7d',
      generatedAt: new Date().toISOString(),
      views: 128420,
      activeUsers: 8914,
      peakTime: '21:00',
      averageWatchMinutes: 18,
      topChannels: [
        { name: 'قناة الأخبار', views: 18420 },
        { name: 'قناة الرياضة', views: 17210 },
        { name: 'قناة الأفلام', views: 15890 },
      ],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="analytics.json"',
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json({ error: 'Failed to export analytics' }, { status: 500 });
  }
}
