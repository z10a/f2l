'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, History, Languages, Moon, Sun, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
}

type FavoriteList = {
  id: string;
  name: string;
  items: { streamId: string }[];
};

type RecentlyWatchedEntry = {
  streamId: string;
  title: string;
  thumbnail: string | null;
  lastWatchedAt: string;
};

const UI_LANGUAGE_KEY = 'uiLanguage';
const UI_THEME_KEY = 'uiTheme';
const RECENTLY_WATCHED_KEY = 'recentlyWatchedStreams';
const USER_PROFILE_KEY = 'userProfile';
const WEBSITE_SETTINGS_KEY = 'websiteSettings';

const COPY = {
  ar: {
    title: 'الملف الشخصي',
    subtitle: 'قم بإدارة تفضيلاتك ومراجعة التوصيات.',
    profileInfo: 'معلومات الحساب',
    displayName: 'اسم العرض',
    email: 'البريد الإلكتروني',
    avatar: 'صورة الملف الشخصي',
    uploadAvatar: 'رفع صورة',
    removeAvatar: 'إزالة الصورة',
    updateProfile: 'تحديث الملف',
    preferences: 'التفضيلات',
    language: 'لغة الواجهة',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    recommendations: 'توصيات لك',
    basedOn: (title: string) => `مبني على: ${title}`,
    similarChannels: 'قنوات مشابهة',
    popularNow: 'الشائعة الآن',
    trending: 'المشاهدة مؤخراً',
    recentViews: 'مشاهدات حديثة',
    emptyRecommendations: 'ابدأ مشاهدة القنوات للحصول على توصيات.',
    favoritesSectionTitle: 'قوائم المفضلة',
    favoritesEmpty: 'لم تقم بإنشاء أي قائمة مفضلة بعد.',
    historySectionTitle: 'سجل المشاهدة',
    historyEmpty: 'لا توجد قنوات مشاهدة مؤخراً.',
    goHome: 'العودة للرئيسية',
    favorites: 'المفضلة',
    history: 'آخر مشاهدة',
  },
  en: {
    title: 'Profile',
    subtitle: 'Manage your preferences and review recommendations.',
    profileInfo: 'Account details',
    displayName: 'Display name',
    email: 'Email',
    avatar: 'Profile photo',
    uploadAvatar: 'Upload photo',
    removeAvatar: 'Remove photo',
    updateProfile: 'Update profile',
    preferences: 'Preferences',
    language: 'Interface language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    recommendations: 'Recommended for you',
    basedOn: (title: string) => `Based on: ${title}`,
    similarChannels: 'Similar channels',
    popularNow: 'Popular now',
    trending: 'Recently watched',
    recentViews: 'Recent views',
    emptyRecommendations: 'Start watching channels to see recommendations.',
    favoritesSectionTitle: 'Favorite lists',
    favoritesEmpty: 'You have not created any favorite list yet.',
    historySectionTitle: 'Watch history',
    historyEmpty: 'No recently watched channels yet.',
    goHome: 'Back to home',
    favorites: 'Favorites',
    history: 'Recently watched',
  },
} as const;

export default function ProfilePage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<RecentlyWatchedEntry[]>([]);
  const [favoriteLists, setFavoriteLists] = useState<FavoriteList[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<{
    title?: string;
    faviconUrl?: string;
    primaryColor?: string;
    fontName?: string;
    fontUrl?: string;
  } | null>(null);

  const labels = useMemo(() => COPY[language], [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const storedLanguage = localStorage.getItem(UI_LANGUAGE_KEY);
    if (storedLanguage === 'ar' || storedLanguage === 'en') {
      setLanguage(storedLanguage);
    }
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
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (!storedProfile) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    const storedHistory = localStorage.getItem(RECENTLY_WATCHED_KEY);
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as RecentlyWatchedEntry[];
        if (Array.isArray(parsed)) {
          setRecentlyWatched(parsed);
        }
      } catch (error) {
        console.error('Failed to parse recently watched:', error);
      }
    }
  }, []);

  useEffect(() => {
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as {
          displayName?: string;
          email?: string;
          avatarDataUrl?: string | null;
        };
        if (typeof parsed.displayName === 'string') {
          setDisplayName(parsed.displayName);
        }
        if (typeof parsed.email === 'string') {
          setEmail(parsed.email);
        }
        if (typeof parsed.avatarDataUrl === 'string') {
          setAvatarDataUrl(parsed.avatarDataUrl);
        }
      } catch (error) {
        console.error('Failed to parse user profile:', error);
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
    const fetchStreams = async () => {
      try {
        const response = await fetch('/api/streams?published=true');
        const data = await response.json();
        setStreams(data);
      } catch (error) {
        console.error('Error fetching streams:', error);
      }
    };
    fetchStreams();
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      const ownerKey = localStorage.getItem('favoritesSyncKey');
      if (!ownerKey) return;
      try {
        const response = await fetch(`/api/favorites/lists?ownerKey=${encodeURIComponent(ownerKey)}`);
        if (!response.ok) return;
        const data = (await response.json()) as FavoriteList[];
        setFavoriteLists(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching favorite lists:', error);
      }
    };
    fetchFavorites();
  }, []);

  const persistProfile = (nextProfile: { displayName: string; email: string; avatarDataUrl: string | null }) => {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(nextProfile));
  };

  const handleProfileUpdate = () => {
    persistProfile({ displayName, email, avatarDataUrl });
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setAvatarDataUrl(result);
      persistProfile({ displayName, email, avatarDataUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarDataUrl(null);
    persistProfile({ displayName, email, avatarDataUrl: null });
  };

  const latestWatchedStream = recentlyWatched.length
    ? streams.find((stream) => stream.id === recentlyWatched[0].streamId)
    : null;

  const extractTitleKeywords = (value: string) =>
    value
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length >= 4);

  const channelsLikeThis = latestWatchedStream
    ? streams
        .filter((stream) => stream.id !== latestWatchedStream.id)
        .filter((stream) => {
          const keywords = extractTitleKeywords(latestWatchedStream.title);
          const haystack = `${stream.title} ${stream.description ?? ''}`.toLowerCase();
          return keywords.some((keyword) => haystack.includes(keyword));
        })
        .slice(0, 6)
    : [];

  const popularNow = streams.slice(0, 6);

  const trendingNow = recentlyWatched
    .map((entry) => streams.find((stream) => stream.id === entry.streamId))
    .filter((stream): stream is Stream => Boolean(stream))
    .slice(0, 6);

  const favoritePreviewLists = favoriteLists.slice(0, 3).map((list) => ({
    ...list,
    previews: list.items
      .map((item) => streams.find((stream) => stream.id === item.streamId))
      .filter((stream): stream is Stream => Boolean(stream))
      .slice(0, 4),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir={dir}>
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <UserCircle className="h-8 w-8" style={{ color: siteSettings?.primaryColor ?? '#dc2626' }} />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{labels.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{labels.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-slate-500 hover:text-red-500">
              {labels.goHome}
            </Link>
            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
            >
              <Languages className="h-3.5 w-3.5" />
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {theme === 'dark' ? labels.light : labels.dark}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">{labels.profileInfo}</CardTitle>
              <CardDescription>{labels.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    {avatarDataUrl ? (
                      <img src={avatarDataUrl} alt={displayName || 'Avatar'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <UserCircle className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{labels.avatar}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? 'قم برفع صورة شخصية تظهر في أعلى الموقع.' : 'Upload a photo for your site avatar.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Label className="sr-only" htmlFor="avatarUpload">
                    {labels.avatar}
                  </Label>
                  <Input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarChange} />
                  {avatarDataUrl && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAvatarRemove}>
                      {labels.removeAvatar}
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">{labels.displayName}</Label>
                <Input
                  id="displayName"
                  placeholder={language === 'ar' ? 'اسم المستخدم' : 'Display name'}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{labels.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleProfileUpdate}>
                {labels.updateProfile}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">{labels.preferences}</CardTitle>
              <CardDescription>{labels.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Languages className="h-4 w-4" />
                  {labels.language}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                >
                  {language === 'ar' ? 'English' : 'العربية'}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {labels.theme}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                >
                  {theme === 'dark' ? labels.light : labels.dark}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <Heart className="h-4 w-4 text-red-500" />
                    {labels.favorites}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'إدارة قائمة القنوات المفضلة.' : 'Manage your favorite channels list.'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <History className="h-4 w-4 text-amber-500" />
                    {labels.history}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ar' ? 'عرض آخر القنوات التي شاهدتها.' : 'Review your recent watch history.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">{labels.favoritesSectionTitle}</CardTitle>
              <CardDescription>{labels.favorites}</CardDescription>
            </CardHeader>
            <CardContent>
              {favoritePreviewLists.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{labels.favoritesEmpty}</p>
              ) : (
                <div className="space-y-4">
                  {favoritePreviewLists.map((list) => (
                    <div key={list.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{list.name}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {language === 'ar' ? `${list.items.length} قناة` : `${list.items.length} channels`}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {list.previews.map((stream) => (
                          <Link key={stream.id} href={`/stream/${stream.id}`} className="group">
                            <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
                              {stream.thumbnail ? (
                                <img src={stream.thumbnail} alt={stream.title} className="h-16 w-full object-cover transition group-hover:scale-105" />
                              ) : (
                                <div className="h-16 w-full bg-slate-100 dark:bg-slate-800" />
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">{labels.historySectionTitle}</CardTitle>
              <CardDescription>{labels.history}</CardDescription>
            </CardHeader>
            <CardContent>
              {recentlyWatched.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">{labels.historyEmpty}</p>
              ) : (
                <div className="space-y-3">
                  {recentlyWatched.slice(0, 6).map((entry) => {
                    const stream = streams.find((item) => item.id === entry.streamId);
                    return (
                      <Link
                        key={entry.streamId}
                        href={`/stream/${entry.streamId}`}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 text-sm text-slate-700 hover:border-red-400 dark:border-slate-800 dark:text-slate-200"
                      >
                        {stream?.thumbnail ? (
                          <img src={stream.thumbnail} alt={stream.title} className="h-12 w-16 rounded-md object-cover" />
                        ) : (
                          <div className="h-12 w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
                        )}
                        <div>
                          <p className="font-semibold line-clamp-1">{entry.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(entry.lastWatchedAt).toLocaleDateString(language === 'ar' ? 'ar' : 'en')}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="mt-10 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{labels.recommendations}</h2>

          {channelsLikeThis.length === 0 && popularNow.length === 0 && trendingNow.length === 0 ? (
            <Card className="border-dashed border-slate-200 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <CardContent className="py-10">{labels.emptyRecommendations}</CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {channelsLikeThis.length > 0 && latestWatchedStream && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg">{labels.similarChannels}</CardTitle>
                    <CardDescription>{labels.basedOn(latestWatchedStream.title)}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {channelsLikeThis.map((stream) => (
                      <Link key={stream.id} href={`/stream/${stream.id}`} className="rounded-xl border border-slate-200 p-3 hover:border-red-400 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          {stream.thumbnail ? (
                            <img src={stream.thumbnail} alt={stream.title} className="h-14 w-20 rounded-lg object-cover" />
                          ) : (
                            <div className="h-14 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{stream.title}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">{stream.description ?? ''}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {popularNow.length > 0 && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg">{labels.popularNow}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {popularNow.map((stream) => (
                      <Link key={stream.id} href={`/stream/${stream.id}`} className="group text-center">
                        <div className="relative overflow-hidden rounded-lg border border-slate-200 shadow-sm transition group-hover:border-red-400 dark:border-slate-800">
                          {stream.thumbnail ? (
                            <img src={stream.thumbnail} alt={stream.title} className="h-20 w-full object-cover" />
                          ) : (
                            <div className="h-20 w-full bg-slate-200 dark:bg-slate-800" />
                          )}
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">{stream.title}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {trendingNow.length > 0 && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg">{labels.trending}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trendingNow.map((stream) => (
                      <Link key={stream.id} href={`/stream/${stream.id}`} className="rounded-xl border border-slate-200 p-3 hover:border-red-400 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{stream.title}</span>
                          <span className="text-xs text-slate-500">{labels.recentViews}</span>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
