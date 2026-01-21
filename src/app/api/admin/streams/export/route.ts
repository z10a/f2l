import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const escapeCsv = (value: string | null | undefined) => {
  if (value === null || value === undefined) return '';
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
};

export async function GET() {
  try {
    const streams = await db.stream.findMany();
    const header = ['id', 'title', 'description', 'thumbnail', 'categoryId', 'published'];
    const rows = streams.map((stream) =>
      [
        stream.id,
        stream.title,
        stream.description ?? '',
        stream.thumbnail ?? '',
        stream.categoryId ?? '',
        stream.published ? 'true' : 'false',
      ].map(escapeCsv).join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="channels.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting channels:', error);
    return NextResponse.json({ error: 'Failed to export channels' }, { status: 500 });
  }
}
