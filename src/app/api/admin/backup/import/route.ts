import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type BackupPayload = {
  users?: Array<{
    id: string;
    email: string;
    name?: string | null;
    password?: string | null;
    role?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>;
  streams?: Array<{
    id: string;
    title: string;
    description?: string | null;
    thumbnail?: string | null;
    categoryId?: string | null;
    published?: boolean;
    authorId: string;
    playlistUrl?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>;
  servers?: Array<{
    id: string;
    streamId: string;
    name: string;
    url: string;
    priority?: number;
    channelId?: string | null;
    channelName?: string | null;
    channelLogo?: string | null;
    tvgId?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>;
  playlists?: Array<{
    id: string;
    streamId: string;
    name: string;
    url: string;
    channels?: number;
    active?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>;
  ads?: Array<{
    id: string;
    streamId?: string | null;
    position: string;
    title?: string | null;
    imageUrl: string;
    linkUrl?: string | null;
    active?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }>;
};

const toDate = (value?: string | Date) => (value ? new Date(value) : undefined);

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as BackupPayload;

    await db.$transaction(async (tx) => {
      await tx.ad.deleteMany();
      await tx.server.deleteMany();
      await tx.playlist.deleteMany();
      await tx.stream.deleteMany();
      await tx.user.deleteMany();

      if (payload.users?.length) {
        await tx.user.createMany({
          data: payload.users.map((user) => ({
            ...user,
            createdAt: toDate(user.createdAt),
            updatedAt: toDate(user.updatedAt),
          })),
        });
      }

      if (payload.streams?.length) {
        await tx.stream.createMany({
          data: payload.streams.map((stream) => ({
            ...stream,
            createdAt: toDate(stream.createdAt),
            updatedAt: toDate(stream.updatedAt),
          })),
        });
      }

      if (payload.servers?.length) {
        await tx.server.createMany({
          data: payload.servers.map((server) => ({
            ...server,
            createdAt: toDate(server.createdAt),
            updatedAt: toDate(server.updatedAt),
          })),
        });
      }

      if (payload.playlists?.length) {
        await tx.playlist.createMany({
          data: payload.playlists.map((playlist) => ({
            ...playlist,
            createdAt: toDate(playlist.createdAt),
            updatedAt: toDate(playlist.updatedAt),
          })),
        });
      }

      if (payload.ads?.length) {
        await tx.ad.createMany({
          data: payload.ads.map((ad) => ({
            ...ad,
            createdAt: toDate(ad.createdAt),
            updatedAt: toDate(ad.updatedAt),
          })),
        });
      }
    });

    return NextResponse.json({ status: 'restored' });
  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json({ error: 'Failed to import backup' }, { status: 500 });
  }
}
