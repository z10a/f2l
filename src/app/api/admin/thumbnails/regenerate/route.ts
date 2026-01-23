import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const getYouTubeThumbnail = (url: string) => {
  const match =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/) || [];
  const videoId = match[1];
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const force = Boolean(body?.force);

    const streams = await db.stream.findMany({
      include: { servers: true },
    });

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const stream of streams) {
      if (!force && stream.thumbnail) {
        skipped += 1;
        continue;
      }

      const serverUrls = stream.servers.map((server) => server.url);
      const serverLogos = stream.servers.map((server) => server.channelLogo).filter(Boolean);
      const youtubeThumbnail =
        serverUrls.map((url) => getYouTubeThumbnail(url)).find(Boolean) || null;
      const nextThumbnail = youtubeThumbnail || serverLogos[0] || null;

      if (!nextThumbnail) {
        skipped += 1;
        continue;
      }

      try {
        await db.stream.update({
          where: { id: stream.id },
          data: { thumbnail: nextThumbnail },
        });
        updated += 1;
      } catch (error) {
        console.error('Failed to update thumbnail for stream:', stream.id, error);
        failed += 1;
      }
    }

    return NextResponse.json({ updated, skipped, failed });
  } catch (error) {
    console.error('Error regenerating thumbnails:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate thumbnails' },
      { status: 500 }
    );
  }
}
