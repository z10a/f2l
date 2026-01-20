'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Tv } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type FavoriteList = {
  id: string;
  name: string;
  items: Array<{ streamId: string }>;
};

type Stream = {
  id: string;
  title: string;
  thumbnail: string | null;
  description: string | null;
};

export default function FavoritesListPage({ params }: { params: { listId: string } }) {
  const [favoriteList, setFavoriteList] = useState<FavoriteList | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadList = async () => {
      try {
        const response = await fetch(`/api/favorites/lists/${params.listId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load list');
        }
        setFavoriteList(data);
      } catch (error) {
        console.error('Error loading favorite list:', error);
      }
    };

    loadList();
  }, [params.listId]);

  useEffect(() => {
    const loadStreams = async () => {
      if (!favoriteList) return;
      try {
        const response = await fetch('/api/streams?published=true');
        const data = await response.json();
        const listIds = new Set(favoriteList.items.map((item) => item.streamId));
        setStreams(data.filter((stream: Stream) => listIds.has(stream.id)));
      } catch (error) {
        console.error('Error loading streams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, [favoriteList]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" dir="rtl">
      <header className="border-b border-slate-200 bg-white py-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <Star className="h-6 w-6 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold">{favoriteList?.name ?? 'قائمة المفضلة'}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {favoriteList ? `${favoriteList.items.length} قناة` : 'جارٍ التحميل...'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-slate-500">جارٍ تحميل القنوات...</div>
        ) : streams.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Tv className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">لا توجد قنوات متاحة في هذه القائمة.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {streams.map((stream) => (
              <Link key={stream.id} href={`/stream/${stream.id}`} className="group">
                <Card className="overflow-hidden border-2 transition-all hover:-translate-y-1 hover:border-red-500 hover:shadow-lg">
                  <div className="relative aspect-video bg-slate-200 dark:bg-slate-800">
                    {stream.thumbnail ? (
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                        <Tv className="h-10 w-10 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="line-clamp-2 text-lg text-slate-800 group-hover:text-red-600 dark:text-slate-100">
                      {stream.title}
                    </CardTitle>
                    {stream.description && (
                      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                        {stream.description}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
