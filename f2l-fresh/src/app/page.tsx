'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Tv, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  published: boolean;
  createdAt: string;
}

interface Ad {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
    fetchAds();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/streams?published=true');
      const data = await response.json();
      setStreams(data);
    } catch (error) {
      console.error('Error fetching streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads?position=home-top&active=true');
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const topAds = ads.filter((ad) => ad.linkUrl);
  const bottomAds = ads.filter((ad) => ad.linkUrl);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-red-700 p-3 rounded-xl">
                <Tv className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                منصة البث المباشر
              </h1>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {streams.length} قناة متاحة
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Top Ad Space */}
        {topAds.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topAds.slice(0, 2).map((ad) => (
                <Link
                  key={ad.id}
                  href={ad.linkUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-yellow-400">
                    <CardContent className="p-0">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title || 'إعلان'}
                        className="w-full h-32 object-cover"
                      />
                      {ad.title && (
                        <p className="p-3 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                          {ad.title}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800 dark:text-slate-100">
            مرحباً بك في منصة البث المباشر
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            استمتع بمشاهدة أفضل القنوات والبث المباشر بجودة عالية
          </p>
        </div>

        {/* Streams Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : streams.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Video className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">
                لا توجد قنوات متاحة حالياً
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                يرجى العودة لاحقاً للمزيد من المحتوى
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {streams.map((stream) => (
              <Link
                key={stream.id}
                href={`/stream/${stream.id}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-red-500">
                  <div className="relative aspect-video bg-slate-200 dark:bg-slate-800">
                    {stream.thumbnail ? (
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                        <Tv className="h-12 w-12 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-red-600 p-4 rounded-full">
                        <Play className="h-8 w-8 text-white fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-md font-bold">
                      مباشر
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-red-600 transition-colors">
                      {stream.title}
                    </CardTitle>
                    {stream.description && (
                      <CardDescription className="line-clamp-2 text-slate-600 dark:text-slate-400">
                        {stream.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom Ad Space */}
        {bottomAds.length > 0 && (
          <div className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bottomAds.slice(0, 3).map((ad) => (
                <Link
                  key={ad.id}
                  href={ad.linkUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 border-yellow-400">
                    <CardContent className="p-0">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title || 'إعلان'}
                        className="w-full h-28 object-cover"
                      />
                      {ad.title && (
                        <p className="p-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                          {ad.title}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-slate-600 dark:text-slate-400">
          <p>© 2025 منصة البث المباشر. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
