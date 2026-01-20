'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Play, Tv, ArrowRight, Home, Server, Zap, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Hls from 'hls.js';
import { toast } from 'sonner';

interface Server {
  id: string;
  name: string;
  url: string;
  priority: number;
  channelId?: string;
  channelName?: string;
  channelLogo?: string;
}

interface Ad {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
}

interface StreamData {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  published: boolean;
  servers: Server[];
  ads: Ad[];
}

export default function StreamPage({ params }: { params: { id: string } }) {
  const [stream, setStream] = useState<StreamData | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    fetchStream();
  }, [params.id]);

  useEffect(() => {
    if (stream && stream.servers.length > 0 && !selectedServer) {
      setSelectedServer(stream.servers[0]);
    }
  }, [stream, selectedServer]);

  useEffect(() => {
    if (selectedServer && videoRef.current) {
      loadStream(selectedServer.url);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [selectedServer]);

  const fetchStream = async () => {
    try {
      const response = await fetch(`/api/streams/${params.id}`);
      if (!response.ok) {
        throw new Error('Stream not found');
      }
      const data = await response.json();
      setStream(data);
    } catch (error) {
      console.error('Error fetching stream:', error);
      setError('فشل في تحميل البث المباشر');
      toast.error('فشل في تحميل البث المباشر');
    } finally {
      setLoading(false);
    }
  };

  const loadStream = (url: string) => {
    if (!videoRef.current) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if URL is m3u8
    const isM3U8 = url.includes('.m3u8');

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS error:', data);
          toast.error('حدث خطأ في البث المباشر');
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = url;
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(console.error);
      });
    } else {
      // Direct file playback
      videoRef.current.src = url;
      videoRef.current.load();
    }
  };

  const handleServerChange = (serverId: string) => {
    const server = stream?.servers.find((s) => s.id === serverId);
    if (server) {
      setSelectedServer(server);
      toast.success(`تم التبديل إلى ${server.channelName || server.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-6" />
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir="rtl">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">حدث خطأ</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'لم يتم العثور على البث المباشر'}</p>
            <Link href="/">
              <Button className="gap-2">
                <Home className="h-4 w-4" />
                العودة إلى الصفحة الرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topAds = stream.ads.filter((ad) => ad.position === 'stream-top');
  const bottomAds = stream.ads.filter((ad) => ad.position === 'stream-bottom');
  const sidebarAds = stream.ads.filter((ad) => ad.position === 'stream-sidebar');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <ArrowRight className="h-5 w-5" />
              <span className="font-medium">العودة</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-red-700 p-2 rounded-lg">
                <Tv className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                منصة البث المباشر
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Top Ads */}
        {topAds.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topAds.map((ad) => (
                ad.linkUrl ? (
                  <a
                    key={ad.id}
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Card className="overflow-hidden border-2 border-yellow-400">
                      <CardContent className="p-0">
                        <img
                          src={ad.imageUrl}
                          alt={ad.title || 'إعلان'}
                          className="w-full h-24 object-cover"
                        />
                      </CardContent>
                    </Card>
                  </a>
                ) : (
                  <Card key={ad.id} className="overflow-hidden border-2 border-yellow-400">
                    <CardContent className="p-0">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title || 'إعلان'}
                        className="w-full h-24 object-cover"
                      />
                    </CardContent>
                  </Card>
                )
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">
                  {stream.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Server Selector */}
                {stream.servers.length > 1 && (
                  <div className="mb-4 flex items-center gap-3">
                    <Server className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <Select
                      value={selectedServer?.id}
                      onValueChange={handleServerChange}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="اختر القناة" />
                      </SelectTrigger>
                      <SelectContent>
                        {stream.servers.map((server) => (
                          <SelectItem key={server.id} value={server.id} className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              {server.channelLogo && (
                                <img
                                  src={server.channelLogo}
                                  alt={server.channelName || server.name}
                                  className="w-5 h-5 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <span>{server.channelName || server.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </div>
                )}

                {/* Video Player */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    playsInline
                    autoPlay
                  />
                  {!selectedServer && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                      <div className="text-center">
                        <Tv className="h-16 w-16 mx-auto mb-4 text-slate-500" />
                        <p className="text-slate-400">اختر قناة للبث</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Server Info */}
                {selectedServer && (
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                      <Server className="h-4 w-4" />
                      <div className="flex items-center gap-2">
                        {selectedServer.channelLogo && (
                          <img
                            src={selectedServer.channelLogo}
                            alt={selectedServer.channelName || selectedServer.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>
                          القناة الحالية: {selectedServer.channelName || selectedServer.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span>متصل</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description Card - More Prominent for SEO */}
            {stream.description && (
              <Card className="mt-6 border-2 border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
                      وصف القناة
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {stream.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-semibold">القناة:</span> {stream.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bottom Ads */}
            {bottomAds.length > 0 && (
              <div className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bottomAds.map((ad) => (
                    ad.linkUrl ? (
                      <a
                        key={ad.id}
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Card className="overflow-hidden border-2 border-yellow-400">
                          <CardContent className="p-0">
                            <img
                              src={ad.imageUrl}
                              alt={ad.title || 'إعلان'}
                              className="w-full h-32 object-cover"
                            />
                          </CardContent>
                        </Card>
                      </a>
                    ) : (
                      <Card key={ad.id} className="overflow-hidden border-2 border-yellow-400">
                        <CardContent className="p-0">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title || 'إعلان'}
                            className="w-full h-32 object-cover"
                          />
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>إعلانات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sidebarAds.length > 0 ? (
                  sidebarAds.map((ad) => (
                    ad.linkUrl ? (
                      <a
                        key={ad.id}
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={ad.imageUrl}
                          alt={ad.title || 'إعلان'}
                          className="w-full h-48 object-cover rounded-lg hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ) : (
                      <img
                        key={ad.id}
                        src={ad.imageUrl}
                        alt={ad.title || 'إعلان'}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Tv className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">لا توجد إعلانات</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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
