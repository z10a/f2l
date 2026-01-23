'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Play,
  Tv,
  ArrowRight,
  Home,
  Server,
  Zap,
  AlertCircle,
  Info,
  PictureInPicture2,
  Gauge,
  Timer,
  LineChart,
  HardDrive,
  Activity,
  MessageCircle,
  Radio,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Hls from 'hls.js';
import { toast } from 'sonner';
import { getStreamQuality } from '@/lib/utils/quality-detection';

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

type RecentlyWatchedEntry = {
  streamId: string;
  title: string;
  thumbnail: string | null;
  lastWatchedAt: string;
  watchTimeSeconds: number;
  lastPositionSeconds: number;
};

type RatingEntry = {
  streamId: string;
  rating: number;
  updatedAt: string;
};

type ReviewEntry = {
  streamId: string;
  comment: string;
  createdAt: string;
};

type ShareCounts = Record<string, number>;
type ChatMessage = {
  id: string;
  message: string;
  user: string;
  timestamp: string;
};

const RECENTLY_WATCHED_KEY = 'recentlyWatchedStreams';
const RATINGS_KEY = 'streamRatings';
const REVIEWS_KEY = 'streamReviews';
const SHARE_COUNTS_KEY = 'streamShareCounts';
const EPG_REMINDERS_KEY = 'epgReminders';
const UI_LANGUAGE_KEY = 'uiLanguage';
const UI_THEME_KEY = 'uiTheme';
const USER_PROFILE_KEY = 'userProfile';
const OFFLINE_CACHE_KEY = 'offlineStreamCache';
const OFFLINE_ENABLED_KEY = 'offlineModeEnabled';
const PERFORMANCE_DASHBOARD_KEY = 'performanceDashboard';
const CHAT_MESSAGES_KEY = 'streamChatMessages';
const FEATURE_FLAGS_KEY = 'websiteFeatureFlags';
const WEBSITE_SETTINGS_KEY = 'websiteSettings';

const STREAM_COPY = {
  ar: {
    appTitle: 'منصة البث المباشر',
    back: 'العودة',
    pickChannel: 'اختر القناة',
    shortcuts: 'اختصارات: ⬅️/➡️ تبديل السيرفر · مساحة تشغيل/إيقاف · M كتم · Esc رجوع',
    pipOn: 'تشغيل PiP',
    pipOff: 'إيقاف PiP',
    currentChannel: 'القناة الحالية:',
    connected: 'متصل',
    descriptionTitle: 'وصف القناة',
    ratingTitle: 'تقييم القناة',
    ratingDesc: 'قيّم القناة وأضف تعليقك.',
    reviewPlaceholder: 'اكتب تعليقاً سريعاً...',
    send: 'إرسال',
    noReviews: 'لا توجد تعليقات بعد.',
    shareTitle: 'مشاركة القناة',
    shareDesc: 'شارك القناة عبر الشبكات الاجتماعية.',
    copyLink: 'نسخ الرابط',
    shareCount: (count: number) => `عدد المشاركات: ${count}`,
    embedCode: 'كود التضمين',
    copyCode: 'نسخ الكود',
    embedCopied: 'تم نسخ كود التضمين',
    scanQr: 'امسح الكود لمشاركة القناة على الهاتف.',
    epgTitle: 'دليل البرامج (EPG)',
    epgDesc: 'تعرف على ما يُعرض الآن وما سيأتي لاحقاً.',
    now: 'يعرض الآن',
    next: 'التالي',
    remind: 'تذكير بهذا البرنامج',
    removeReminder: 'إلغاء التذكير',
    programDetails: 'تفاصيل البرامج',
    details: 'تفاصيل',
    liveTitle: (title: string) => `البث المباشر: ${title}`,
    nextTitle: (title: string) => `البرنامج التالي: ${title}`,
    liveDescFallback: 'متابعة أحدث الأحداث المباشرة على القناة.',
    nextDescFallback: 'تحليل وأحداث لاحقة مع أبرز اللقطات.',
    backHome: 'العودة إلى الصفحة الرئيسية',
    footer: '© 2025 منصة البث المباشر. جميع الحقوق محفوظة.',
    ratingAria: (stars: number) => `تقييم القناة بـ ${stars} نجوم`,
    themeToggle: 'الوضع الليلي',
    themeToggleLight: 'الوضع الفاتح',
    performanceTitle: 'لوحة الأداء',
    performanceSubtitle: 'مؤشرات لتحسين جودة البث أثناء المشاهدة.',
    performanceLoadTime: 'زمن تحميل الصفحة',
    performanceStreamQuality: 'مؤشر الجودة',
    performanceConnection: 'سرعة الاتصال',
    performanceTest: 'اختبار السرعة',
    performanceCacheStatus: 'حالة التخزين',
    performanceCacheEnabled: 'التخزين مفعّل',
    performanceCacheDisabled: 'التخزين غير مفعّل',
    performanceOptimize: 'اقتراحات التحسين',
    performanceOptimizeFast: 'الأداء ممتاز، استمتع بالمشاهدة.',
    performanceOptimizeCache: 'فعّل التخزين لتحسين التصفح دون اتصال.',
    performanceOptimizeReduce: 'قلل الحركة لتجربة أكثر سلاسة.',
    performanceOptimizeServer: 'جرّب تبديل السيرفر لتحسين الجودة.',
    performanceKbps: (value: number) => `${value.toFixed(0)} كيلوبت/ث`,
    performanceMs: (value: number) => `${value.toFixed(0)} مللي ثانية`,
    liveChatTitle: 'الدردشة المباشرة',
    liveChatDesc: 'تواصل مع المشاهدين داخل غرفة القناة.',
    liveChatPlaceholder: 'اكتب رسالة...',
    liveChatSend: 'إرسال',
    liveChatEmpty: 'لا توجد رسائل بعد.',
    webRtcTitle: 'مشغل WebRTC',
    webRtcDesc: 'تجربة بث منخفضة التأخير عبر WebRTC.',
    webRtcEnable: 'تفعيل WebRTC',
    webRtcDisable: 'إيقاف WebRTC',
  },
  en: {
    appTitle: 'Live Streaming Platform',
    back: 'Back',
    pickChannel: 'Select channel',
    shortcuts: 'Shortcuts: ←/→ switch server · Space play/pause · M mute · Esc back',
    pipOn: 'Enable PiP',
    pipOff: 'Disable PiP',
    currentChannel: 'Current channel:',
    connected: 'Connected',
    descriptionTitle: 'Channel description',
    ratingTitle: 'Channel rating',
    ratingDesc: 'Rate the channel and leave a quick review.',
    reviewPlaceholder: 'Write a quick review...',
    send: 'Send',
    noReviews: 'No reviews yet.',
    shareTitle: 'Share channel',
    shareDesc: 'Share the channel on social media.',
    copyLink: 'Copy link',
    shareCount: (count: number) => `Shares: ${count}`,
    embedCode: 'Embed code',
    copyCode: 'Copy code',
    embedCopied: 'Embed code copied',
    scanQr: 'Scan the code to share on mobile.',
    epgTitle: 'EPG (Program Guide)',
    epgDesc: 'See what is on now and what is next.',
    now: 'Now airing',
    next: 'Up next',
    remind: 'Remind me',
    removeReminder: 'Remove reminder',
    programDetails: 'Program details',
    details: 'Details',
    liveTitle: (title: string) => `Live: ${title}`,
    nextTitle: (title: string) => `Up next: ${title}`,
    liveDescFallback: 'Catch the latest live moments on this channel.',
    nextDescFallback: 'Analysis and highlights coming up next.',
    backHome: 'Back to home',
    footer: '© 2025 Live Streaming Platform. All rights reserved.',
    ratingAria: (stars: number) => `Rate channel ${stars} stars`,
    themeToggle: 'Dark mode',
    themeToggleLight: 'Light mode',
    performanceTitle: 'Performance dashboard',
    performanceSubtitle: 'Signals to improve stream playback.',
    performanceLoadTime: 'Page load time',
    performanceStreamQuality: 'Quality signal',
    performanceConnection: 'Connection speed',
    performanceTest: 'Run speed test',
    performanceCacheStatus: 'Cache status',
    performanceCacheEnabled: 'Caching enabled',
    performanceCacheDisabled: 'Caching disabled',
    performanceOptimize: 'Optimization tips',
    performanceOptimizeFast: 'Great performance — enjoy the stream.',
    performanceOptimizeCache: 'Enable caching to improve offline browsing.',
    performanceOptimizeReduce: 'Reduce motion for smoother UI.',
    performanceOptimizeServer: 'Try switching servers to improve quality.',
    performanceKbps: (value: number) => `${value.toFixed(0)} kbps`,
    performanceMs: (value: number) => `${value.toFixed(0)} ms`,
    liveChatTitle: 'Live chat',
    liveChatDesc: 'Chat with viewers in the channel room.',
    liveChatPlaceholder: 'Write a message...',
    liveChatSend: 'Send',
    liveChatEmpty: 'No messages yet.',
    webRtcTitle: 'WebRTC player',
    webRtcDesc: 'Low-latency playback via WebRTC.',
    webRtcEnable: 'Enable WebRTC',
    webRtcDisable: 'Disable WebRTC',
  },
} as const;

export default function StreamPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const streamId = params?.id;
  const previewUrl = searchParams?.get('url') ?? '';
  const previewTitle = searchParams?.get('title') ?? 'Bloomberg Originals';
  const previewLogo = searchParams?.get('logo');
  const [stream, setStream] = useState<StreamData | null>(null);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, RatingEntry>>({});
  const [reviews, setReviews] = useState<Record<string, ReviewEntry[]>>({});
  const [reviewDraft, setReviewDraft] = useState('');
  const [shareCounts, setShareCounts] = useState<ShareCounts>({});
  const [embedCopied, setEmbedCopied] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [epgReminders, setEpgReminders] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [pageLoadMs, setPageLoadMs] = useState<number | null>(null);
  const [connectionKbps, setConnectionKbps] = useState<number | null>(null);
  const [speedTestRunning, setSpeedTestRunning] = useState(false);
  const [cachedStreamsCount, setCachedStreamsCount] = useState(0);
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [useWebRtc, setUseWebRtc] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [siteSettings, setSiteSettings] = useState<{
    title?: string;
    faviconUrl?: string;
    primaryColor?: string;
    fontName?: string;
    fontUrl?: string;
  } | null>(null);
  const [featureFlags, setFeatureFlags] = useState({
    aiRecommendations: true,
    pushNotifications: true,
    engagementAnalytics: true,
    appsSection: true,
    offlineMode: true,
    accessibility: true,
    userFeatures: true,
    quickActions: true,
    liveChat: true,
    webRtc: true,
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastPlaybackTimeRef = useRef<number | null>(null);
  const watchTimeBufferRef = useRef(0);
  const lastSavedPositionRef = useRef(0);

  const labels = useMemo(() => STREAM_COPY[language], [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!streamId) return;
    if (previewUrl) {
      setStream({
        id: streamId,
        title: previewTitle,
        description: 'Bloomberg Originals Live Stream',
        thumbnail: previewLogo ?? null,
        published: true,
        servers: [
          {
            id: 'preview-server',
            name: 'Primary',
            url: previewUrl,
            priority: 0,
            channelName: previewTitle,
            channelLogo: previewLogo ?? undefined,
          },
        ],
        ads: [],
      });
      setLoading(false);
      setError(null);
      return;
    }
    fetchStream(streamId);
  }, [previewUrl, previewLogo, previewTitle, streamId]);

  useEffect(() => {
    const storedFlags = localStorage.getItem(FEATURE_FLAGS_KEY);
    if (storedFlags) {
      try {
        const parsed = JSON.parse(storedFlags) as Partial<typeof featureFlags>;
        setFeatureFlags((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse feature flags:', error);
      }
    }
  }, []);

  useEffect(() => {
    const storedSettings = localStorage.getItem(WEBSITE_SETTINGS_KEY);
    if (!storedSettings) return;
    try {
      const parsed = JSON.parse(storedSettings) as {
        title?: string;
        faviconUrl?: string;
        primaryColor?: string;
        fontName?: string;
        fontUrl?: string;
      };
      setSiteSettings(parsed);
      if (parsed.title) {
        document.title = parsed.title;
      }
      if (parsed.primaryColor) {
        document.documentElement.style.setProperty('--brand-color', parsed.primaryColor);
      }
      if (parsed.fontName) {
        document.documentElement.style.fontFamily = `${parsed.fontName}, ui-sans-serif, system-ui`;
      }
      if (parsed.fontUrl) {
        const fontStyleId = 'custom-font-style';
        let styleTag = document.getElementById(fontStyleId) as HTMLStyleElement | null;
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = fontStyleId;
          document.head.appendChild(styleTag);
        }
        const fontName = parsed.fontName || 'CustomFont';
        styleTag.textContent = `
@font-face {
  font-family: '${fontName}';
  src: url('${parsed.fontUrl}');
  font-display: swap;
}
`;
      }
      if (parsed.faviconUrl) {
        const faviconId = 'site-favicon';
        let link = document.getElementById(faviconId) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.id = faviconId;
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = parsed.faviconUrl;
      }
    } catch (error) {
      console.error('Failed to parse site settings:', error);
    }
  }, []);

  useEffect(() => {
    if (!streamId) return;
    const storedChat = localStorage.getItem(`${CHAT_MESSAGES_KEY}:${streamId}`);
    if (storedChat) {
      try {
        const parsed = JSON.parse(storedChat) as ChatMessage[];
        if (Array.isArray(parsed)) {
          setChatMessages(parsed);
        }
      } catch (error) {
        console.error('Failed to parse chat messages:', error);
      }
    }
  }, [streamId]);

  useEffect(() => {
    if (!streamId) return;
    localStorage.setItem(`${CHAT_MESSAGES_KEY}:${streamId}`, JSON.stringify(chatMessages));
  }, [chatMessages, streamId]);

  useEffect(() => {
    const storedLanguage = localStorage.getItem(UI_LANGUAGE_KEY);
    if (storedLanguage === 'ar' || storedLanguage === 'en') {
      setLanguage(storedLanguage);
      return;
    }
    const detected = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'ar';
    setLanguage(detected);
  }, []);

  useEffect(() => {
    localStorage.setItem(UI_LANGUAGE_KEY, language);
    document.documentElement.dir = dir;
  }, [dir, language]);

  useEffect(() => {
    const storedTheme = localStorage.getItem(UI_THEME_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
      return;
    }
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    localStorage.setItem(UI_THEME_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const storedCache = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (storedCache) {
      try {
        const parsed = JSON.parse(storedCache) as { id: string }[];
        if (Array.isArray(parsed)) {
          setCachedStreamsCount(parsed.length);
        }
      } catch (error) {
        console.error('Failed to parse offline cache:', error);
      }
    }
    const storedEnabled = localStorage.getItem(OFFLINE_ENABLED_KEY);
    if (storedEnabled) {
      setCacheEnabled(storedEnabled === 'true');
    }
    const storedPerformance = localStorage.getItem(PERFORMANCE_DASHBOARD_KEY);
    if (storedPerformance) {
      try {
        const parsed = JSON.parse(storedPerformance) as {
          pageLoadMs?: number | null;
          connectionKbps?: number | null;
        };
        if (typeof parsed.pageLoadMs === 'number') {
          setPageLoadMs(parsed.pageLoadMs);
        }
        if (typeof parsed.connectionKbps === 'number') {
          setConnectionKbps(parsed.connectionKbps);
        }
      } catch (error) {
        console.error('Failed to parse performance metrics:', error);
      }
    }
  }, []);

  useEffect(() => {
    const updateLoadTime = () => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (navEntry) {
        setPageLoadMs(navEntry.loadEventEnd);
      }
    };
    if (document.readyState === 'complete') {
      updateLoadTime();
    } else {
      window.addEventListener('load', updateLoadTime);
      return () => window.removeEventListener('load', updateLoadTime);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      PERFORMANCE_DASHBOARD_KEY,
      JSON.stringify({
        pageLoadMs,
        connectionKbps,
      })
    );
  }, [pageLoadMs, connectionKbps]);

  const runSpeedTest = async () => {
    if (speedTestRunning) return;
    setSpeedTestRunning(true);
    try {
      const connection = (navigator as Navigator & { connection?: { downlink?: number } }).connection;
      if (connection?.downlink) {
        setConnectionKbps(connection.downlink * 1000);
      } else {
        const start = performance.now();
        await fetch(`/favicon.ico?cacheBust=${Date.now()}`, { cache: 'no-store' });
        const duration = performance.now() - start;
        const estimatedKbps = Math.max(1, (32 / duration) * 1000);
        setConnectionKbps(estimatedKbps);
      }
    } catch (error) {
      console.error('Speed test failed:', error);
    } finally {
      setSpeedTestRunning(false);
    }
  };

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnter = () => setPipActive(true);
    const handleLeave = () => setPipActive(false);

    video.addEventListener('enterpictureinpicture', handleEnter);
    video.addEventListener('leavepictureinpicture', handleLeave);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnter);
      video.removeEventListener('leavepictureinpicture', handleLeave);
    };
  }, []);

  useEffect(() => {
    if (!stream) return;
    upsertRecentlyWatched({
      streamId: stream.id,
      title: stream.title,
      thumbnail: stream.thumbnail ?? null,
    });
  }, [stream]);

  useEffect(() => {
    const storedRatings = localStorage.getItem(RATINGS_KEY);
    if (storedRatings) {
      try {
        const parsed = JSON.parse(storedRatings) as Record<string, RatingEntry>;
        if (parsed && typeof parsed === 'object') {
          setRatings(parsed);
        }
      } catch (error) {
        console.error('Failed to parse ratings:', error);
      }
    }

    const storedReviews = localStorage.getItem(REVIEWS_KEY);
    if (storedReviews) {
      try {
        const parsed = JSON.parse(storedReviews) as Record<string, ReviewEntry[]>;
        if (parsed && typeof parsed === 'object') {
          setReviews(parsed);
        }
      } catch (error) {
        console.error('Failed to parse reviews:', error);
      }
    }

    const storedShareCounts = localStorage.getItem(SHARE_COUNTS_KEY);
    if (storedShareCounts) {
      try {
        const parsed = JSON.parse(storedShareCounts) as ShareCounts;
        if (parsed && typeof parsed === 'object') {
          setShareCounts(parsed);
        }
      } catch (error) {
        console.error('Failed to parse share counts:', error);
      }
    }

    const storedReminders = localStorage.getItem(EPG_REMINDERS_KEY);
    if (storedReminders) {
      try {
        const parsed = JSON.parse(storedReminders) as Record<string, boolean>;
        if (parsed && typeof parsed === 'object') {
          setEpgReminders(parsed);
        }
      } catch (error) {
        console.error('Failed to parse EPG reminders:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem(SHARE_COUNTS_KEY, JSON.stringify(shareCounts));
  }, [shareCounts]);

  useEffect(() => {
    localStorage.setItem(EPG_REMINDERS_KEY, JSON.stringify(epgReminders));
  }, [epgReminders]);

  useEffect(() => {
    if (!embedCopied) return;
    const timeout = window.setTimeout(() => setEmbedCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [embedCopied]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const handleTimeUpdate = () => {
      if (video.paused || video.seeking) return;
      const currentTime = video.currentTime;
      if (lastPlaybackTimeRef.current !== null) {
        const delta = Math.max(0, currentTime - lastPlaybackTimeRef.current);
        watchTimeBufferRef.current += delta;
      }
      lastPlaybackTimeRef.current = currentTime;

      if (Math.abs(currentTime - lastSavedPositionRef.current) >= 5) {
        persistWatchProgress(currentTime);
      }
    };

    const handlePause = () => {
      if (!video.paused) return;
      persistWatchProgress(video.currentTime, true);
    };

    const handleEnded = () => {
      persistWatchProgress(video.currentTime, true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistWatchProgress(video.currentTime, true);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stream]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const video = videoRef.current;
      if (!video) return;

      if (event.key === ' ') {
        event.preventDefault();
        if (video.paused) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }

      if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        video.muted = !video.muted;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        video.play().catch(console.error);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        router.back();
      }

      if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && stream?.servers.length) {
        const currentIndex = stream.servers.findIndex((server) => server.id === selectedServer?.id);
        const nextIndex =
          event.key === 'ArrowRight'
            ? (currentIndex + 1) % stream.servers.length
            : (currentIndex - 1 + stream.servers.length) % stream.servers.length;
        setSelectedServer(stream.servers[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [router, selectedServer, stream]);

  const fetchStream = async (id: string) => {
    try {
      const response = await fetch(`/api/streams/${id}`);
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

  const loadRecentlyWatched = (): RecentlyWatchedEntry[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(RECENTLY_WATCHED_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as RecentlyWatchedEntry[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (error) {
      console.error('Failed to parse recently watched:', error);
      return [];
    }
  };

  const saveRecentlyWatched = (entries: RecentlyWatchedEntry[]) => {
    localStorage.setItem(RECENTLY_WATCHED_KEY, JSON.stringify(entries));
  };

  const upsertRecentlyWatched = (base: { streamId: string; title: string; thumbnail: string | null }) => {
    const entries = loadRecentlyWatched();
    const now = new Date().toISOString();
    const existingIndex = entries.findIndex((entry) => entry.streamId === base.streamId);
    const existing = existingIndex >= 0 ? entries[existingIndex] : null;
    const nextEntry: RecentlyWatchedEntry = {
      streamId: base.streamId,
      title: base.title,
      thumbnail: base.thumbnail,
      lastWatchedAt: now,
      watchTimeSeconds: existing?.watchTimeSeconds ?? 0,
      lastPositionSeconds: existing?.lastPositionSeconds ?? 0,
    };

    const nextEntries = existingIndex >= 0
      ? [nextEntry, ...entries.filter((entry) => entry.streamId !== base.streamId)]
      : [nextEntry, ...entries];

    saveRecentlyWatched(nextEntries.slice(0, 20));
  };

  const persistWatchProgress = (currentTime: number, force = false) => {
    if (!stream) return;
    if (!force && watchTimeBufferRef.current < 1 && Math.abs(currentTime - lastSavedPositionRef.current) < 5) {
      return;
    }

    const entries = loadRecentlyWatched();
    const now = new Date().toISOString();
    const existingIndex = entries.findIndex((entry) => entry.streamId === stream.id);
    const existing = existingIndex >= 0 ? entries[existingIndex] : null;
    const watchTimeSeconds = (existing?.watchTimeSeconds ?? 0) + watchTimeBufferRef.current;
    const nextEntry: RecentlyWatchedEntry = {
      streamId: stream.id,
      title: stream.title,
      thumbnail: stream.thumbnail ?? null,
      lastWatchedAt: now,
      watchTimeSeconds,
      lastPositionSeconds: currentTime,
    };

    const nextEntries = existingIndex >= 0
      ? [nextEntry, ...entries.filter((entry) => entry.streamId !== stream.id)]
      : [nextEntry, ...entries];

    saveRecentlyWatched(nextEntries.slice(0, 20));
    watchTimeBufferRef.current = 0;
    lastSavedPositionRef.current = currentTime;
  };

  const getShareUrl = () => {
    if (!stream || typeof window === 'undefined') return '';
    return `${window.location.origin}/stream/${stream.id}`;
  };

  const incrementShareCount = () => {
    if (!stream) return;
    setShareCounts((prev) => ({
      ...prev,
      [stream.id]: (prev[stream.id] ?? 0) + 1,
    }));
  };

  const shareToPlatform = (platform: 'whatsapp' | 'twitter' | 'facebook') => {
    if (!stream) return;
    const shareUrl = getShareUrl();
    if (!shareUrl) return;
    const message = `شاهد قناة ${stream.title}`;
    let target = '';
    if (platform === 'whatsapp') {
      target = `https://wa.me/?text=${encodeURIComponent(`${message} ${shareUrl}`)}`;
    }
    if (platform === 'twitter') {
      target = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;
    }
    if (platform === 'facebook') {
      target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    }
    window.open(target, '_blank', 'noopener,noreferrer');
    incrementShareCount();
  };

  const copyShareLink = async () => {
    if (!stream) return;
    const shareUrl = getShareUrl();
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      incrementShareCount();
      toast.success('تم نسخ رابط المشاركة');
    } catch (error) {
      console.error('Failed to copy share link:', error);
      toast.error('تعذر نسخ الرابط');
    }
  };

  const copyEmbedCode = async () => {
    if (!stream) return;
    const shareUrl = getShareUrl();
    if (!shareUrl) return;
    const embedCode = `<iframe src="${shareUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      incrementShareCount();
    } catch (error) {
      console.error('Failed to copy embed code:', error);
      toast.error('تعذر نسخ كود التضمين');
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) {
      toast.error('وضع PiP غير مدعوم في هذا المتصفح');
      return;
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to toggle PiP:', error);
      toast.error('تعذر تشغيل وضع PiP');
    }
  };

  const setStreamRating = (rating: number) => {
    if (!stream) return;
    const nextRating = Math.max(1, Math.min(5, rating));
    setRatings((prev) => ({
      ...prev,
      [stream.id]: {
        streamId: stream.id,
        rating: nextRating,
        updatedAt: new Date().toISOString(),
      },
    }));
    toast.success(`تم تقييم ${stream.title} بـ ${nextRating} نجوم`);
  };

  const submitReview = () => {
    if (!stream) return;
    const comment = reviewDraft.trim();
    if (!comment) return;
    setReviews((prev) => ({
      ...prev,
      [stream.id]: [
        {
          streamId: stream.id,
          comment,
          createdAt: new Date().toISOString(),
        },
        ...(prev[stream.id] ?? []),
      ].slice(0, 5),
    }));
    setReviewDraft('');
    toast.success('تم إرسال التعليق');
  };

  const handleSendChatMessage = () => {
    const message = chatDraft.trim();
    if (!message || !streamId) return;
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
    let displayName = language === 'ar' ? 'زائر' : 'Guest';
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as { displayName?: string };
        if (parsed.displayName) {
          displayName = parsed.displayName;
        }
      } catch (error) {
        console.error('Failed to parse user profile:', error);
      }
    }
    const entry: ChatMessage = {
      id: crypto.randomUUID(),
      message,
      user: displayName,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [entry, ...prev].slice(0, 50));
    setChatDraft('');
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
                {labels.backHome}
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
  const currentRating = ratings[stream.id]?.rating ?? 0;
  const streamReviews = reviews[stream.id] ?? [];
  const shareCount = shareCounts[stream.id] ?? 0;
  const shareUrl = getShareUrl();
  const now = new Date();
  const formatTime = (value: Date) =>
    value.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const currentProgram = {
    id: `${stream.id}-now`,
    title: labels.liveTitle(stream.title),
    start: formatTime(new Date(now.getTime() - 30 * 60000)),
    end: formatTime(new Date(now.getTime() + 30 * 60000)),
    description: stream.description || labels.liveDescFallback,
  };
  const nextProgram = {
    id: `${stream.id}-next`,
    title: labels.nextTitle(stream.title),
    start: formatTime(new Date(now.getTime() + 30 * 60000)),
    end: formatTime(new Date(now.getTime() + 90 * 60000)),
    description: labels.nextDescFallback,
  };
  const schedule = [currentProgram, nextProgram];
  const activeQuality = getStreamQuality(selectedServer?.url ?? '');
  const optimizeSuggestions = [
    !cacheEnabled && labels.performanceOptimizeCache,
    labels.performanceOptimizeReduce,
    stream?.servers.length && activeQuality.level === 'Unknown' ? labels.performanceOptimizeServer : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir={dir}>
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
              <ArrowRight className="h-5 w-5" />
              <span className="font-medium">{labels.back}</span>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: siteSettings?.primaryColor ?? '#dc2626' }}
              >
                <Tv className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                {labels.appTitle}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
            >
              {theme === 'dark' ? labels.themeToggleLight : labels.themeToggle}
            </button>
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
                      <SelectValue placeholder={labels.pickChannel} />
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

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{labels.shortcuts}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePictureInPicture}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
                    >
                      <PictureInPicture2 className="h-4 w-4" />
                      {pipActive ? labels.pipOff : labels.pipOn}
                    </button>
                    {featureFlags.webRtc && (
                      <button
                        type="button"
                        onClick={() => setUseWebRtc((prev) => !prev)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                          useWebRtc
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Radio className="h-4 w-4" />
                        {useWebRtc ? labels.webRtcDisable : labels.webRtcEnable}
                      </button>
                    )}
                  </div>
                </div>

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

                {featureFlags.webRtc && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      <span className="font-semibold">{labels.webRtcTitle}</span>
                    </div>
                    <span>{labels.webRtcDesc}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {useWebRtc ? 'WebRTC ON' : 'HLS'}
                    </span>
                  </div>
                )}

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
                          {labels.currentChannel} {selectedServer.channelName || selectedServer.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      <span>{labels.connected}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6 border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
                    {labels.performanceTitle}
                  </CardTitle>
                </div>
                <CardDescription>{labels.performanceSubtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Timer className="h-4 w-4" />
                      {labels.performanceLoadTime}
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {pageLoadMs ? labels.performanceMs(pageLoadMs) : '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <LineChart className="h-4 w-4" />
                      {labels.performanceStreamQuality}
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {activeQuality.label}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        {labels.performanceConnection}
                      </span>
                      <button
                        type="button"
                        onClick={runSpeedTest}
                        disabled={speedTestRunning}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        {speedTestRunning ? '...' : labels.performanceTest}
                      </button>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {connectionKbps ? labels.performanceKbps(connectionKbps) : '—'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <HardDrive className="h-4 w-4" />
                      {labels.performanceCacheStatus}
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {cacheEnabled ? labels.performanceCacheEnabled : labels.performanceCacheDisabled}
                    </p>
                    <p className="text-xs text-slate-500">{cachedStreamsCount}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Activity className="h-4 w-4" />
                    {labels.performanceOptimize}
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500 dark:text-slate-400">
                    {optimizeSuggestions.length === 0 ? (
                      <li>{labels.performanceOptimizeFast}</li>
                    ) : (
                      optimizeSuggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Description Card - More Prominent for SEO */}
            {stream.description && (
              <Card className="mt-6 border-2 border-blue-200 dark:border-blue-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
                      {labels.descriptionTitle}
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

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-2 border-amber-200 dark:border-amber-900">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">{labels.ratingTitle}</CardTitle>
                  <CardDescription>{labels.ratingDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xl text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setStreamRating(star)}
                          className={`transition ${currentRating >= star ? 'text-amber-500' : 'text-slate-300'}`}
                          aria-label={labels.ratingAria(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-slate-500">{currentRating.toFixed(1)} / 5</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reviewDraft}
                      onChange={(event) => setReviewDraft(event.target.value)}
                      placeholder={labels.reviewPlaceholder}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={submitReview}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      {labels.send}
                    </button>
                  </div>

                  {streamReviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      {labels.noReviews}
                    </div>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      {streamReviews.map((entry) => (
                        <li key={entry.createdAt} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                          <p className="text-xs text-slate-500">{entry.comment}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-200 dark:border-emerald-900">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">{labels.shareTitle}</CardTitle>
                  <CardDescription>{labels.shareDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => shareToPlatform('whatsapp')}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => shareToPlatform('twitter')}
                      className="rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-600"
                    >
                      Twitter
                    </button>
                    <button
                      type="button"
                      onClick={() => shareToPlatform('facebook')}
                      className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={copyShareLink}
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
                    >
                      {labels.copyLink}
                    </button>
                  </div>

                  <div className="text-xs text-slate-500">{labels.shareCount(shareCount)}</div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{labels.embedCode}</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          shareUrl
                            ? `<iframe src="${shareUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
                            : ''
                        }
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={copyEmbedCode}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        {labels.copyCode}
                      </button>
                    </div>
                    {embedCopied && (
                      <p className="mt-1 text-xs text-amber-600">{labels.embedCopied}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {shareUrl ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}`}
                        alt="QR code"
                        className="h-28 w-28 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800"
                      />
                    ) : (
                      <div className="h-28 w-28 rounded-xl border border-dashed border-slate-300 dark:border-slate-700" />
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {labels.scanQr}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-2 border-indigo-200 dark:border-indigo-900">
              <CardHeader>
              <CardTitle className="text-xl text-slate-800 dark:text-slate-100">{labels.epgTitle}</CardTitle>
              <CardDescription>{labels.epgDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-emerald-500 font-semibold">{labels.now}</p>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{currentProgram.title}</h4>
                    <p className="text-xs text-slate-500">{currentProgram.start} - {currentProgram.end}</p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{currentProgram.description}</p>
                    <button
                      type="button"
                      onClick={() => setEpgReminders((prev) => ({ ...prev, [currentProgram.id]: !prev[currentProgram.id] }))}
                      className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-300"
                    >
                      {epgReminders[currentProgram.id] ? labels.removeReminder : labels.remind}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs text-indigo-500 font-semibold">{labels.next}</p>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{nextProgram.title}</h4>
                    <p className="text-xs text-slate-500">{nextProgram.start} - {nextProgram.end}</p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{nextProgram.description}</p>
                    <button
                      type="button"
                      onClick={() => setEpgReminders((prev) => ({ ...prev, [nextProgram.id]: !prev[nextProgram.id] }))}
                      className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-400 dark:border-slate-700 dark:text-slate-300"
                    >
                      {epgReminders[nextProgram.id] ? labels.removeReminder : labels.remind}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{labels.programDetails}</h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {schedule.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                          <p className="text-slate-500">{item.start} - {item.end}</p>
                        </div>
                        <span className="text-slate-400">{labels.details}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

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
            {featureFlags.liveChat && (
              <Card className="mb-6 border-2 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-slate-500" />
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-100">
                      {labels.liveChatTitle}
                    </CardTitle>
                  </div>
                  <CardDescription>{labels.liveChatDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <p className="text-xs text-slate-500">{labels.liveChatEmpty}</p>
                    ) : (
                      chatMessages.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{entry.user}</span>
                            <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                            {entry.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      placeholder={labels.liveChatPlaceholder}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={handleSendChatMessage}
                      className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      {labels.liveChatSend}
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

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
          <p>{labels.footer}</p>
        </div>
      </footer>
    </div>
  );
}
