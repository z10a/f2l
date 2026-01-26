'use client';

import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import {
  Play,
  Tv,
  Video,
  Search,
  ChevronLeft,
  ChevronRight,
  Pin,
  Star,
  Copy,
  MoreVertical,
  ExternalLink,
  Flag,
  Share2,
  UserCircle,
  CloudDownload,
  HardDrive,
  Wifi,
  WifiOff,
  Accessibility,
  Contrast,
  Type,
  Activity,
  SlidersHorizontal,
  Bot,
  Bell,
  Smartphone,
  MonitorSmartphone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { extractResolutionFromUrl, getStreamQuality } from '@/lib/utils/quality-detection';

type StreamStatus = 'online' | 'offline' | 'testing';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  categoryId: string | null;
  published: boolean;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string | null;
  };
  servers: Server[];
  playlistUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Server {
  id: string;
  name: string;
  url: string;
  priority: number;
}

interface Ad {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

type FavoriteList = {
  id: string;
  name: string;
  streamIds: string[];
};

type RecentlyWatchedEntry = {
  streamId: string;
  title: string;
  thumbnail: string | null;
  lastWatchedAt: string;
  watchTimeSeconds: number;
  lastPositionSeconds: number;
};

const RECENTLY_WATCHED_KEY = 'recentlyWatchedStreams';
const OFFLINE_CACHE_KEY = 'offlineStreamCache';
const OFFLINE_ENABLED_KEY = 'offlineModeEnabled';
const OFFLINE_ONLY_KEY = 'offlineShowCachedOnly';
const OFFLINE_SYNC_PENDING_KEY = 'offlineSyncPending';
const ACCESSIBILITY_SETTINGS_KEY = 'accessibilitySettings';
const PUSH_SETTINGS_KEY = 'pushNotificationSettings';
const ENGAGEMENT_METRICS_KEY = 'engagementMetrics';
const FEATURE_FLAGS_KEY = 'websiteFeatureFlags';

const CATEGORY_OPTIONS = ['all', 'sports', 'news', 'movies', 'kids', 'music'] as const;
const LANGUAGE_OPTIONS = ['all', 'arabic', 'english'] as const;
const COUNTRY_OPTIONS = ['all', 'saudi', 'egypt', 'uae'] as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  sports: ['sports', 'sport', 'رياضة', 'رياضي', 'كرة', 'الدوري', 'premier', 'liga', 'nba', 'ufc'],
  news: ['news', 'أخبار', 'اخبار', 'news', 'cnn', 'bbc', 'الجزيرة'],
  movies: ['movies', 'movie', 'cinema', 'أفلام', 'فيلم', 'سينما'],
  kids: ['kids', 'children', 'أطفال', 'طفل', 'cartoon', 'كرتون'],
  music: ['music', 'songs', 'موسيقى', 'أغاني', 'اغاني'],
};

const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  arabic: ['عربي', 'العربية', 'arabic', 'ar'],
  english: ['english', 'eng', 'en'],
};

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  saudi: ['saudi', 'ksa', 'السعودية', 'السعوديه', 'الرياض', 'جدة'],
  egypt: ['egypt', 'egy', 'مصر', 'القاهرة', 'اسكندرية'],
  uae: ['uae', 'dubai', 'abudhabi', 'الإمارات', 'الامارات'],
};

const UI_LANGUAGE_KEY = 'uiLanguage';
const UI_THEME_KEY = 'uiTheme';
const USER_PROFILE_KEY = 'userProfile';
const WEBSITE_SETTINGS_KEY = 'websiteSettings';

const UI_COPY = {
  ar: {
    title: 'منصة البث المباشر',
    available: (count: number) => `${count} قناة متاحة`,
    welcomeTitle: 'مرحباً بك في منصة البث المباشر',
    welcomeBody: 'استمتع بمشاهدة أفضل القنوات والبث المباشر بجودة عالية',
    searchPlaceholder: 'ابحث عن قناة...',
    filtersTitle: 'الفلاتر',
    category: 'الفئة',
    language: 'اللغة',
    country: 'الدولة',
    resetFilters: 'إعادة ضبط الفلاتر',
    filtersNote: 'يتم حفظ تفضيلات الفلاتر تلقائياً',
    userFeatures: 'ميزات المستخدم',
    userFeaturesHint: 'المفضلة + المشاهدة الأخيرة في قائمة قابلة للطي.',
    favorites: 'المفضلة',
    favoritesDesc: 'قم بتمييز القنوات المفضلة لديك والوصول إليها بسرعة',
    favoritesOnly: 'عرض المفضلة فقط',
    shareList: 'مشاركة القائمة',
    favoritesList: 'قائمة المفضلة',
    noLists: 'لا توجد قوائم بعد',
    newListPlaceholder: 'اسم قائمة جديدة (مثال: رياضتي)',
    createList: 'إنشاء قائمة',
    syncKey: 'مفتاح المزامنة',
    syncHint: 'استخدم نفس المفتاح على أجهزة أخرى لمزامنة المفضلة.',
    recentlyWatched: 'شوهد مؤخراً',
    recentlyWatchedDesc: 'تابع القنوات الأخيرة واستكمل المشاهدة من حيث توقفت.',
    totalWatch: 'إجمالي وقت المشاهدة:',
    clearHistory: 'مسح السجل',
    emptyHistory: 'لم تبدأ مشاهدة أي قناة بعد.',
    continueWatching: 'متابعة المشاهدة',
    lastStop: 'آخر توقف محفوظ',
    lastStopAt: (time: string) => `آخر توقف عند ${time}`,
    watchDuration: (time: string) => `مدة المشاهدة: ${time}`,
    watchAgain: 'شاهد مرة أخرى',
    latestChannels: 'أحدث القنوات',
    noChannels: 'لا توجد قنوات متاحة حالياً',
    trySearch: 'حاول البحث بكلمات مختلفة',
    previous: 'السابق',
    next: 'التالي',
    from: 'من',
    live: 'مباشر',
    quickActions: 'إجراءات سريعة',
    addFavorite: 'إضافة للمفضلة',
    shareChannel: 'مشاركة القناة',
    openNewTab: 'فتح في تبويب جديد',
    reportIssue: 'إبلاغ عن مشكلة',
    copyLinkSuccess: (title: string) => `تم نسخ رابط ${title}`,
    reportSuccess: (title: string) => `تم إرسال بلاغ عن ${title}`,
    copyLinkError: 'تعذر نسخ الرابط',
    similarChannels: 'قنوات مشابهة',
    basedOn: (title: string) => `مبني على: ${title}`,
    popularNow: 'الشائعة الآن',
    trending: 'الأكثر تداولاً',
    recentViews: 'مشاهدات حديثة',
    filtersSaved: 'تم حفظ تفضيلات الفلاتر تلقائياً',
    profileRecommendations: 'التوصيات متاحة في ملفك الشخصي الآن.',
    profileRecommendationsCta: 'عرض التوصيات',
    profile: 'ملفي',
    aiRecommendationsTitle: 'توصيات ذكية',
    aiRecommendationsDesc: 'اقتراحات تعتمد على اهتماماتك والبيانات الحديثة.',
    aiRecommendationsAction: 'عرض التوصيات الذكية',
    aiRecommendationsEmpty: 'لا توجد توصيات حالياً.',
    notificationsTitle: 'إشعارات الدفع',
    notificationsDesc: 'فعّل التنبيهات لتصلك أحدث القنوات.',
    notificationsEnable: 'تفعيل الإشعارات',
    notificationsDisable: 'إيقاف الإشعارات',
    notificationsStatusEnabled: 'مفعل',
    notificationsStatusDisabled: 'غير مفعل',
    notificationsUnsupported: 'الإشعارات غير مدعومة في هذا المتصفح.',
    analyticsTitle: 'تحليلات التفاعل',
    analyticsDesc: 'ملخص لنشاط الزوار على الموقع.',
    analyticsVisits: 'عدد الزيارات',
    analyticsSearches: 'عمليات البحث',
    analyticsOpens: 'فتح القنوات',
    analyticsFavorites: 'إضافات للمفضلة',
    analyticsShares: 'مشاركات الروابط',
    appsTitle: 'تطبيقات المنصة',
    appsDesc: 'حمّل تطبيقات الهاتف والتلفزيون للمشاهدة السريعة.',
    appIos: 'تطبيق iOS',
    appAndroid: 'تطبيق Android',
    appSamsung: 'تطبيق Samsung TV',
    appLg: 'تطبيق LG TV',
    appAndroidTv: 'تطبيق Android TV',
    offlineTitle: 'الوضع دون اتصال',
    offlineSubtitle: 'احفظ القنوات لتصفحها بدون إنترنت ومزامنتها لاحقاً.',
    offlineStatusOnline: 'متصل',
    offlineStatusOffline: 'غير متصل',
    offlineEnable: 'تفعيل الوضع دون اتصال',
    offlineDownload: 'تنزيل القوائم الحالية',
    offlineDownloadDesc: 'يحفظ القنوات الحالية على هذا الجهاز.',
    offlineShowCached: 'عرض المخزن فقط',
    offlineCachedCount: (count: number) => `قنوات مخزنة: ${count}`,
    offlineClearCache: 'مسح التخزين',
    offlineSyncQueued: 'سيتم تحديث التخزين عند عودة الاتصال.',
    offlineSynced: 'تم تحديث التخزين بنجاح.',
    offlineOfflineNotice: 'أنت غير متصل. يتم عرض القنوات المخزنة.',
    accessibilityTitle: 'إمكانية الوصول',
    accessibilitySubtitle: 'خيارات لتسهيل القراءة والتنقل.',
    accessibilityHighContrast: 'تباين عالي',
    accessibilityLargeText: 'نص كبير',
    accessibilityReducedMotion: 'تقليل الحركة',
    accessibilityKeyboardHint: 'يدعم التنقل عبر لوحة المفاتيح.',
    accessibilityScreenReaderHint: 'محسّن لقارئات الشاشة.',
    categoryOptions: {
      all: 'كل الفئات',
      sports: 'رياضة',
      news: 'أخبار',
      movies: 'أفلام',
      kids: 'أطفال',
      music: 'موسيقى',
    },
    languageOptions: { all: 'كل اللغات', arabic: 'العربية', english: 'English' },
    countryOptions: { all: 'كل الدول', saudi: 'السعودية', egypt: 'مصر', uae: 'الإمارات' },
    languageToggle: 'English',
    themeToggle: 'الوضع الليلي',
    themeToggleLight: 'الوضع الفاتح',
    footer: '© 2025 منصة البث المباشر. جميع الحقوق محفوظة.',
  },
  en: {
    title: 'Live Streaming Platform',
    available: (count: number) => `${count} channels available`,
    welcomeTitle: 'Welcome to the Live Streaming Platform',
    welcomeBody: 'Enjoy the best live channels in high quality',
    searchPlaceholder: 'Search for a channel...',
    filtersTitle: 'Filters',
    category: 'Category',
    language: 'Language',
    country: 'Country',
    resetFilters: 'Reset filters',
    filtersNote: 'Filter preferences are saved automatically',
    userFeatures: 'User Features',
    userFeaturesHint: 'Favorites + Recently Watched in a collapsible panel.',
    favorites: 'Favorites',
    favoritesDesc: 'Star channels to reach them quickly.',
    favoritesOnly: 'Show favorites only',
    shareList: 'Share list',
    favoritesList: 'Favorite list',
    noLists: 'No lists yet',
    newListPlaceholder: 'New list name (e.g., My Sports)',
    createList: 'Create list',
    syncKey: 'Sync key',
    syncHint: 'Use the same key on other devices to sync favorites.',
    recentlyWatched: 'Recently Watched',
    recentlyWatchedDesc: 'Continue where you left off.',
    totalWatch: 'Total watch time:',
    clearHistory: 'Clear history',
    emptyHistory: 'No channels watched yet.',
    continueWatching: 'Continue watching',
    lastStop: 'Last saved position',
    lastStopAt: (time: string) => `Last stopped at ${time}`,
    watchDuration: (time: string) => `Watch time: ${time}`,
    watchAgain: 'Watch again',
    latestChannels: 'Latest channels',
    noChannels: 'No channels available right now',
    trySearch: 'Try different keywords',
    previous: 'Previous',
    next: 'Next',
    from: 'of',
    live: 'Live',
    quickActions: 'Quick actions',
    addFavorite: 'Add to favorites',
    shareChannel: 'Share channel',
    openNewTab: 'Open in new tab',
    reportIssue: 'Report issue',
    copyLinkSuccess: (title: string) => `Link copied for ${title}`,
    reportSuccess: (title: string) => `Report submitted for ${title}`,
    copyLinkError: 'Unable to copy link',
    similarChannels: 'Channels like this',
    basedOn: (title: string) => `Based on: ${title}`,
    popularNow: 'Popular now',
    trending: 'Trending',
    recentViews: 'Recent views',
    filtersSaved: 'Filter preferences saved automatically',
    profileRecommendations: 'Recommendations are now available in your profile.',
    profileRecommendationsCta: 'View recommendations',
    profile: 'Profile',
    aiRecommendationsTitle: 'AI recommendations',
    aiRecommendationsDesc: 'Smart picks based on recent activity and interest.',
    aiRecommendationsAction: 'Show AI recommendations',
    aiRecommendationsEmpty: 'No recommendations yet.',
    notificationsTitle: 'Push notifications',
    notificationsDesc: 'Enable alerts to get notified about new channels.',
    notificationsEnable: 'Enable notifications',
    notificationsDisable: 'Disable notifications',
    notificationsStatusEnabled: 'Enabled',
    notificationsStatusDisabled: 'Disabled',
    notificationsUnsupported: 'Notifications are not supported in this browser.',
    analyticsTitle: 'Engagement analytics',
    analyticsDesc: 'Summary of user activity on the website.',
    analyticsVisits: 'Total visits',
    analyticsSearches: 'Searches',
    analyticsOpens: 'Channel opens',
    analyticsFavorites: 'Favorites added',
    analyticsShares: 'Link shares',
    appsTitle: 'Platform apps',
    appsDesc: 'Download mobile and smart TV apps for quick access.',
    appIos: 'iOS App',
    appAndroid: 'Android App',
    appSamsung: 'Samsung TV App',
    appLg: 'LG TV App',
    appAndroidTv: 'Android TV App',
    offlineTitle: 'Offline mode',
    offlineSubtitle: 'Save channels for offline browsing and sync later.',
    offlineStatusOnline: 'Online',
    offlineStatusOffline: 'Offline',
    offlineEnable: 'Enable offline mode',
    offlineDownload: 'Download current lists',
    offlineDownloadDesc: 'Stores the current channel list on this device.',
    offlineShowCached: 'Show cached only',
    offlineCachedCount: (count: number) => `Cached channels: ${count}`,
    offlineClearCache: 'Clear cache',
    offlineSyncQueued: 'Cache will refresh when you are back online.',
    offlineSynced: 'Cache refreshed successfully.',
    offlineOfflineNotice: 'You are offline. Showing cached channels.',
    accessibilityTitle: 'Accessibility',
    accessibilitySubtitle: 'Options to improve reading and navigation.',
    accessibilityHighContrast: 'High contrast',
    accessibilityLargeText: 'Large text',
    accessibilityReducedMotion: 'Reduced motion',
    accessibilityKeyboardHint: 'Keyboard navigation supported.',
    accessibilityScreenReaderHint: 'Optimized for screen readers.',
    categoryOptions: {
      all: 'All categories',
      sports: 'Sports',
      news: 'News',
      movies: 'Movies',
      kids: 'Kids',
      music: 'Music',
    },
    languageOptions: { all: 'All languages', arabic: 'Arabic', english: 'English' },
    countryOptions: { all: 'All countries', saudi: 'Saudi Arabia', egypt: 'Egypt', uae: 'UAE' },
    languageToggle: 'العربية',
    themeToggle: 'Dark mode',
    themeToggleLight: 'Light mode',
    footer: '© 2025 Live Streaming Platform. All rights reserved.',
  },
} as const;

export default function Home() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedStreams, setPinnedStreams] = useState<Set<string>>(new Set());
  const [streamStatuses, setStreamStatuses] = useState<Map<string, StreamStatus>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: 'all',
    language: 'all',
    country: 'all',
  });
  const [favoriteLists, setFavoriteLists] = useState<FavoriteList[]>([]);
  const [activeFavoriteListId, setActiveFavoriteListId] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [syncKey, setSyncKey] = useState('');
  const [newListName, setNewListName] = useState('');
  const [recentlyWatched, setRecentlyWatched] = useState<RecentlyWatchedEntry[]>([]);
  const [showUserFeatures, setShowUserFeatures] = useState(true);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [siteSettings, setSiteSettings] = useState<{
    title?: string;
    faviconUrl?: string;
    appIconUrl?: string;
    primaryColor?: string;
    fontName?: string;
    fontUrl?: string;
  } | null>(null);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [showCachedOnly, setShowCachedOnly] = useState(false);
  const [cachedStreams, setCachedStreams] = useState<Stream[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSyncPending, setOfflineSyncPending] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showOfflinePanel, setShowOfflinePanel] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [featureFlags, setFeatureFlags] = useState({
    featuredChannels: true,
    mainHero: true,
    mainSearch: true,
    mainFilters: true,
    mainAds: true,
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
  const [engagementMetrics, setEngagementMetrics] = useState({
    visits: 0,
    searches: 0,
    opens: 0,
    favorites: 0,
    shares: 0,
  });
  const pageSize = 50; // Show 50 channels per page

  const labels = useMemo(() => UI_COPY[language], [language]);
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const storedPins = localStorage.getItem('pinnedStreams');
    if (storedPins) {
      try {
        const parsedPins = JSON.parse(storedPins) as string[];
        setPinnedStreams(new Set(parsedPins));
      } catch (error) {
        console.error('Failed to parse pinned streams:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === FEATURE_FLAGS_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as Partial<typeof featureFlags>;
          setFeatureFlags((prev) => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Failed to parse feature flags:', error);
        }
      }
      if (event.key === 'pinnedStreams' && event.newValue) {
        try {
          const parsedPins = JSON.parse(event.newValue) as string[];
          setPinnedStreams(new Set(parsedPins));
        } catch (error) {
          console.error('Failed to parse pinned streams:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const storedSyncKey = localStorage.getItem('favoritesSyncKey');
    if (storedSyncKey) {
      setSyncKey(storedSyncKey);
    } else {
      const generatedKey = crypto.randomUUID();
      localStorage.setItem('favoritesSyncKey', generatedKey);
      setSyncKey(generatedKey);
    }
  }, []);

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
    const storedOfflineEnabled = localStorage.getItem(OFFLINE_ENABLED_KEY);
    if (storedOfflineEnabled) {
      setOfflineEnabled(storedOfflineEnabled === 'true');
    }
    const storedShowCachedOnly = localStorage.getItem(OFFLINE_ONLY_KEY);
    if (storedShowCachedOnly) {
      setShowCachedOnly(storedShowCachedOnly === 'true');
    }
    const storedCache = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (storedCache) {
      try {
        const parsed = JSON.parse(storedCache) as Stream[];
        if (Array.isArray(parsed)) {
          setCachedStreams(parsed);
        }
      } catch (error) {
        console.error('Failed to parse offline cache:', error);
      }
    }
    const storedPending = localStorage.getItem(OFFLINE_SYNC_PENDING_KEY);
    if (storedPending) {
      setOfflineSyncPending(storedPending === 'true');
    }
    const storedAccessibility = localStorage.getItem(ACCESSIBILITY_SETTINGS_KEY);
    if (storedAccessibility) {
      try {
        const parsed = JSON.parse(storedAccessibility) as {
          highContrast?: boolean;
          largeText?: boolean;
          reducedMotion?: boolean;
        };
        setHighContrast(Boolean(parsed.highContrast));
        setLargeText(Boolean(parsed.largeText));
        setReducedMotion(Boolean(parsed.reducedMotion));
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
  }, []);

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
    if (!featureFlags.offlineMode) {
      setShowOfflinePanel(false);
    }
    if (!featureFlags.accessibility) {
      setShowAccessibilityPanel(false);
    }
    if (!featureFlags.pushNotifications) {
      setShowNotificationsPanel(false);
      setPushEnabled(false);
    }
    if (!featureFlags.aiRecommendations) {
      setShowAiPanel(false);
    }
    if (!featureFlags.mainFilters) {
      setShowFiltersPanel(false);
      setFilters({ category: 'all', language: 'all', country: 'all' });
    }
    if (!featureFlags.mainSearch) {
      setSearchQuery('');
    }
  }, [featureFlags]);

  useEffect(() => {
    const storedPush = localStorage.getItem(PUSH_SETTINGS_KEY);
    if (storedPush) {
      try {
        const parsed = JSON.parse(storedPush) as { enabled?: boolean };
        setPushEnabled(Boolean(parsed.enabled));
      } catch (error) {
        console.error('Failed to parse push settings:', error);
      }
    }
    if (typeof window !== 'undefined' && !('Notification' in window)) {
      setPushSupported(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify({ enabled: pushEnabled }));
  }, [pushEnabled]);

  useEffect(() => {
    const storedMetrics = localStorage.getItem(ENGAGEMENT_METRICS_KEY);
    if (storedMetrics) {
      try {
        const parsed = JSON.parse(storedMetrics) as typeof engagementMetrics;
        setEngagementMetrics(parsed);
      } catch (error) {
        console.error('Failed to parse engagement metrics:', error);
      }
    }
    if (featureFlags.engagementAnalytics) {
      setEngagementMetrics((prev) => {
        const next = { ...prev, visits: prev.visits + 1 };
        localStorage.setItem(ENGAGEMENT_METRICS_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [featureFlags.engagementAnalytics]);

  useEffect(() => {
    localStorage.setItem(ENGAGEMENT_METRICS_KEY, JSON.stringify(engagementMetrics));
  }, [engagementMetrics]);

  useEffect(() => {
    localStorage.setItem(OFFLINE_ENABLED_KEY, String(offlineEnabled));
  }, [offlineEnabled]);

  useEffect(() => {
    localStorage.setItem(OFFLINE_ONLY_KEY, String(showCachedOnly));
  }, [showCachedOnly]);

  useEffect(() => {
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cachedStreams));
  }, [cachedStreams]);

  useEffect(() => {
    localStorage.setItem(OFFLINE_SYNC_PENDING_KEY, String(offlineSyncPending));
  }, [offlineSyncPending]);

  useEffect(() => {
    localStorage.setItem(
      ACCESSIBILITY_SETTINGS_KEY,
      JSON.stringify({
        highContrast,
        largeText,
        reducedMotion,
      })
    );
  }, [highContrast, largeText, reducedMotion]);

  useEffect(() => {
    document.documentElement.classList.toggle('accessibility-high-contrast', highContrast);
    document.documentElement.classList.toggle('accessibility-large-text', largeText);
    document.documentElement.classList.toggle('accessibility-reduced-motion', reducedMotion);
  }, [highContrast, largeText, reducedMotion]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile) as {
          displayName?: string;
          avatarDataUrl?: string | null;
          email?: string;
        };
        if (typeof parsed.displayName === 'string') {
          setProfileName(parsed.displayName);
        }
        if (typeof parsed.avatarDataUrl === 'string') {
          setProfileAvatar(parsed.avatarDataUrl);
        }
        if (typeof parsed.email === 'string') {
          setProfileEmail(parsed.email);
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
        siteTitle?: string;
        faviconUrl?: string;
        appIconUrl?: string;
        primaryColor?: string;
        fontName?: string;
        fontUrl?: string;
      };
      const nextSettings = {
        ...parsed,
        title: parsed.title ?? parsed.siteTitle,
      };
      setSiteSettings(nextSettings);
      if (nextSettings.title) {
        document.title = nextSettings.title;
      }
      if (nextSettings.primaryColor) {
        document.documentElement.style.setProperty('--brand-color', nextSettings.primaryColor);
      }
      if (nextSettings.fontName) {
        document.documentElement.style.fontFamily = `${nextSettings.fontName}, ui-sans-serif, system-ui`;
      }
      if (nextSettings.fontUrl) {
        const fontStyleId = 'custom-font-style';
        let styleTag = document.getElementById(fontStyleId) as HTMLStyleElement | null;
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = fontStyleId;
          document.head.appendChild(styleTag);
        }
        const fontName = nextSettings.fontName || 'CustomFont';
        styleTag.textContent = `
@font-face {
  font-family: '${fontName}';
  src: url('${nextSettings.fontUrl}');
  font-display: swap;
}
`;
      }
      if (nextSettings.faviconUrl) {
        const faviconId = 'site-favicon';
        let link = document.getElementById(faviconId) as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.id = faviconId;
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = nextSettings.faviconUrl;
      }
    } catch (error) {
      console.error('Failed to parse site settings:', error);
    }
  }, []);

  useEffect(() => {
    if (!syncKey) return;
    fetchFavoriteLists(syncKey);
  }, [syncKey]);

  useEffect(() => {
    const storedFilters = localStorage.getItem('streamFilters');
    if (storedFilters) {
      try {
        const parsedFilters = JSON.parse(storedFilters) as {
          category?: string;
          language?: string;
          country?: string;
        };
        setFilters((prev) => ({
          category: parsedFilters.category ?? prev.category,
          language: parsedFilters.language ?? prev.language,
          country: parsedFilters.country ?? prev.country,
        }));
      } catch (error) {
        console.error('Failed to parse filters:', error);
      }
    }
  }, []);

  useEffect(() => {
    const storedHistory = localStorage.getItem(RECENTLY_WATCHED_KEY);
    if (!storedHistory) return;
    try {
      const parsed = JSON.parse(storedHistory) as RecentlyWatchedEntry[];
      if (Array.isArray(parsed)) {
        setRecentlyWatched(parsed);
      }
    } catch (error) {
      console.error('Failed to parse recently watched:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('streamFilters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    if (!actionNotice) return;
    const timeout = window.setTimeout(() => setActionNotice(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [actionNotice]);

  useEffect(() => {
    if (!offlineNotice) return;
    const timeout = window.setTimeout(() => setOfflineNotice(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [offlineNotice]);

  const refreshOfflineCache = async () => {
    try {
      const response = await fetch('/api/streams?published=true');
      const data = await response.json();
      if (Array.isArray(data)) {
        setCachedStreams(data);
        setOfflineNotice(labels.offlineSynced);
      }
    } catch (error) {
      console.error('Error refreshing offline cache:', error);
    }
  };

  const handleOfflineDownload = async () => {
    if (!offlineEnabled) {
      setOfflineEnabled(true);
    }
    if (!isOnline) {
      setOfflineSyncPending(true);
      setOfflineNotice(labels.offlineSyncQueued);
      return;
    }
    await refreshOfflineCache();
  };

  const handleClearOfflineCache = () => {
    setCachedStreams([]);
  };

  useEffect(() => {
    if (!offlineEnabled) return;
    if (!isOnline) {
      setOfflineNotice(labels.offlineOfflineNotice);
      return;
    }
    if (offlineSyncPending) {
      refreshOfflineCache().finally(() => setOfflineSyncPending(false));
    }
  }, [isOnline, offlineEnabled, offlineSyncPending, labels.offlineOfflineNotice]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    if (searchQuery.trim()) {
      recordEngagement('searches');
    }
  }, [searchQuery, filters]);

  // Filter streams based on search query
  const normalizeText = (value: string) => value.toLowerCase();

  const matchesFilter = (value: string, keywords: string[]) =>
    keywords.some((keyword) => value.includes(keyword.toLowerCase()));

  const shouldUseCache = offlineEnabled && (!isOnline || showCachedOnly);
  const streamSource = shouldUseCache ? cachedStreams : streams;

  const filteredStreams = streamSource.filter((stream) => {
    const searchLower = searchQuery.toLowerCase();
    const haystack = normalizeText(
      `${stream.title} ${stream.description ?? ''} ${stream.categoryId ?? ''}`
    );

    const searchMatch =
      stream.title.toLowerCase().includes(searchLower) ||
      stream.description?.toLowerCase().includes(searchLower);

    if (!searchMatch) return false;

    if (filters.category !== 'all') {
      const categoryKeywords = CATEGORY_KEYWORDS[filters.category] ?? [];
      if (!matchesFilter(haystack, categoryKeywords)) return false;
    }

    if (filters.language !== 'all') {
      const languageKeywords = LANGUAGE_KEYWORDS[filters.language] ?? [];
      if (!matchesFilter(haystack, languageKeywords)) return false;
    }

    if (filters.country !== 'all') {
      const countryKeywords = COUNTRY_KEYWORDS[filters.country] ?? [];
      if (!matchesFilter(haystack, countryKeywords)) return false;
    }

    if (favoritesOnly && activeFavoriteListId) {
      const activeList = favoriteLists.find((list) => list.id === activeFavoriteListId);
      if (!activeList?.streamIds.includes(stream.id)) return false;
    }

    return true;
  });

  const sortedStreams = [...filteredStreams].sort((a, b) => {
    const aPinned = featureFlags.featuredChannels && pinnedStreams.has(a.id);
    const bPinned = featureFlags.featuredChannels && pinnedStreams.has(b.id);
    if (aPinned === bPinned) return 0;
    return aPinned ? -1 : 1;
  });

  const aiRecommendations = useMemo(() => {
    const source = searchQuery.trim() ? filteredStreams : sortedStreams;
    const fallback = source.length > 0 ? source : streams;
    return fallback.slice(0, 6);
  }, [filteredStreams, searchQuery, sortedStreams, streams]);

  // Paginate streams
  const totalPages = Math.ceil(sortedStreams.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStreams = sortedStreams.slice(startIndex, endIndex);

  useEffect(() => {
    fetchStreams();
    fetchAds();
  }, []);

  useEffect(() => {
    if (streams.length === 0) return;
    setStreamStatuses(new Map(streams.map((stream) => [stream.id, 'testing'])));

    const intervalId = window.setInterval(() => {
      fetchStreamStatuses();
    }, 30000);

    fetchStreamStatuses();

    return () => {
      window.clearInterval(intervalId);
    };
  }, [streams]);

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

  const fetchStreamStatuses = async () => {
    try {
      const response = await fetch('/api/channels/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamIds: streams.map((stream) => stream.id) }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Status check failed');
      }

      setStreamStatuses((prev) => {
        const next = new Map(prev);
        data.results.forEach((result: { streamId: string; status: 'working' | 'broken' }) => {
          next.set(result.streamId, result.status === 'working' ? 'online' : 'offline');
        });
        return next;
      });
    } catch (error) {
      console.error('Error fetching stream status:', error);
    }
  };

  const statusMeta: Record<StreamStatus, { label: string; className: string }> = {
    online: {
      label: 'القناة تعمل الآن',
      className: 'bg-emerald-500 shadow-emerald-500/40',
    },
    offline: {
      label: 'القناة غير متاحة حالياً',
      className: 'bg-red-500 shadow-red-500/40',
    },
    testing: {
      label: 'جارٍ فحص حالة القناة',
      className: 'bg-yellow-400 shadow-yellow-400/40',
    },
  };

  const topAds = ads.filter((ad) => ad.linkUrl);
  const bottomAds = ads.filter((ad) => ad.linkUrl);

  const fetchFavoriteLists = async (ownerKey: string) => {
    try {
      const response = await fetch(`/api/favorites/lists?ownerKey=${encodeURIComponent(ownerKey)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch lists');
      }

      const lists = (data as Array<{ id: string; name: string; items: Array<{ streamId: string }> }>).map(
        (list) => ({
          id: list.id,
          name: list.name,
          streamIds: list.items.map((item) => item.streamId),
        })
      );

      setFavoriteLists(lists);
      if (!activeFavoriteListId && lists.length > 0) {
        setActiveFavoriteListId(lists[0].id);
      }
    } catch (error) {
      console.error('Error fetching favorite lists:', error);
    }
  };

  const createFavoriteList = async () => {
    if (!syncKey || !newListName.trim()) return;
    try {
      const response = await fetch('/api/favorites/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerKey: syncKey, name: newListName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create list');
      }
      setFavoriteLists((prev) => [
        { id: data.id, name: data.name, streamIds: [] },
        ...prev,
      ]);
      setActiveFavoriteListId(data.id);
      setNewListName('');
    } catch (error) {
      console.error('Error creating favorite list:', error);
    }
  };

  const updateFavoriteList = async (list: FavoriteList) => {
    try {
      const response = await fetch('/api/favorites/lists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: list.id,
          name: list.name,
          streamIds: list.streamIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update list');
      }
      setFavoriteLists((prev) =>
        prev.map((item) =>
          item.id === list.id
            ? {
                id: data.id,
                name: data.name,
                streamIds: data.items.map((entry: { streamId: string }) => entry.streamId),
              }
            : item
        )
      );
    } catch (error) {
      console.error('Error updating favorite list:', error);
    }
  };

  const toggleFavorite = async (streamId: string) => {
    let listId = activeFavoriteListId;
    if (!listId) {
      const defaultName = 'مفضلتي';
      const response = await fetch('/api/favorites/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerKey: syncKey, name: defaultName }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to create default list:', data.error || 'error');
        return;
      }
      const createdList = { id: data.id, name: data.name, streamIds: [] };
      setFavoriteLists((prev) => [createdList, ...prev]);
      setActiveFavoriteListId(createdList.id);
      listId = createdList.id;
    }

    const list = favoriteLists.find((item) => item.id === listId) ?? {
      id: listId,
      name: 'مفضلتي',
      streamIds: [],
    };

    const updatedList = list.streamIds.includes(streamId)
      ? { ...list, streamIds: list.streamIds.filter((id) => id !== streamId) }
      : { ...list, streamIds: [...list.streamIds, streamId] };

    setFavoriteLists((prev) =>
      prev.some((item) => item.id === list.id)
        ? prev.map((item) => (item.id === list.id ? updatedList : item))
        : [updatedList, ...prev]
    );
    recordEngagement('favorites');
    await updateFavoriteList(updatedList);
  };

  const updateSyncKey = (value: string) => {
    setSyncKey(value);
    localStorage.setItem('favoritesSyncKey', value);
  };

  const shareActiveList = async () => {
    if (!activeFavoriteListId) return;
    const shareUrl = `${window.location.origin}/favorites/${activeFavoriteListId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to copy share link:', error);
    }
  };

  const copyStreamLink = async (stream: Stream) => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/stream/${stream.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setActionNotice(labels.copyLinkSuccess(stream.title));
      recordEngagement('shares');
    } catch (error) {
      console.error('Failed to copy stream link:', error);
      setActionNotice(labels.copyLinkError);
    }
  };

  const reportBrokenChannel = (stream: Stream) => {
    setActionNotice(labels.reportSuccess(stream.title));
  };

  const openInNewTab = (stream: Stream) => {
    if (typeof window === 'undefined') return;
    window.open(`/stream/${stream.id}`, '_blank', 'noopener,noreferrer');
    recordEngagement('opens');
  };

  const recordEngagement = (key: keyof typeof engagementMetrics) => {
    if (!featureFlags.engagementAnalytics) return;
    setEngagementMetrics((prev) => ({
      ...prev,
      [key]: prev[key] + 1,
    }));
  };

  const handleStreamClick = (streamId: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    recordEngagement('opens');
    localStorage.setItem('lastOpenedStream', streamId);
  };

  const togglePushNotifications = async () => {
    if (!pushSupported) return;
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushSupported(false);
      return;
    }
    if (pushEnabled) {
      setPushEnabled(false);
      return;
    }
    const permission = await window.Notification.requestPermission();
    setPushEnabled(permission === 'granted');
  };

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}س ${minutes.toString().padStart(2, '0')}د`;
    }
    return `${minutes}د ${remainingSeconds.toString().padStart(2, '0')}ث`;
  };

  const clearRecentlyWatched = () => {
    localStorage.removeItem(RECENTLY_WATCHED_KEY);
    setRecentlyWatched([]);
  };

  const getPrimaryServerUrl = (stream: Stream): string => {
    if (!stream.servers?.length) return '';
    const primary = [...stream.servers].sort((a, b) => a.priority - b.priority)[0];
    return primary?.url ?? '';
  };

  const extractFps = (value: string): string | null => {
    const match = value.match(/(?:^|\s)(30|50|60)\s?fps/i);
    return match ? `${match[1]}fps` : null;
  };

  const extractResolutionFromMetadata = (value: string): string | null => {
    const match = value.match(/(2160|1440|1080|720)p/i);
    return match ? `${match[1]}p` : null;
  };

  const extractBitrateMbps = (value: string): string | null => {
    const mbpsMatch = value.match(/(\d+(?:\.\d+)?)\s?mbps/i);
    if (mbpsMatch) {
      return `${mbpsMatch[1]} Mbps`;
    }
    const kbpsMatch = value.match(/(\d+(?:\.\d+)?)\s?kbps/i);
    if (kbpsMatch) {
      const mbps = parseFloat(kbpsMatch[1]) / 1000;
      return `${mbps.toFixed(1)} Mbps`;
    }
    return null;
  };

  const qualityBadgeStyles: Record<string, string> = {
    '4K': 'border-pink-500 text-pink-600 dark:text-pink-400',
    FHD: 'border-purple-500 text-purple-600 dark:text-purple-400',
    HD: 'border-blue-500 text-blue-600 dark:text-blue-400',
    SD: 'border-slate-500 text-slate-600 dark:text-slate-300',
    Unknown: 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400',
  };

  const continueWatching = recentlyWatched
    .filter((entry) => entry.lastPositionSeconds > 30)
    .sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())
    .slice(0, 6);

  const watchAgain = recentlyWatched
    .filter((entry) => entry.watchTimeSeconds > 0)
    .sort((a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime())
    .slice(0, 8);

  const totalWatchTimeSeconds = recentlyWatched.reduce((acc, entry) => acc + entry.watchTimeSeconds, 0);

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 ${
        highContrast ? 'contrast-125' : ''
      } ${largeText ? 'text-[1.05rem]' : ''} ${reducedMotion ? 'motion-reduce:transition-none' : ''}`}
      dir={dir}
    >
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: siteSettings?.primaryColor ?? '#dc2626' }}
              >
                {siteSettings?.appIconUrl ? (
                  <img
                    src={siteSettings.appIconUrl}
                    alt={siteSettings.title ?? labels.title}
                    className="h-6 w-6 object-contain"
                  />
                ) : (
                  <Tv className="h-6 w-6 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {siteSettings?.title ?? labels.title}
              </h1>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {labels.available(filteredStreams.length)}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {profileEmail ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
                  aria-label={labels.profile}
                >
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt={profileName || labels.profile} className="h-full w-full object-cover" />
                    ) : (
                      <UserCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="hidden sm:inline">{profileName || labels.profile}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
                  >
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    style={{ backgroundColor: siteSettings?.primaryColor ?? '#dc2626' }}
                  >
                    {language === 'ar' ? 'إنشاء حساب' : 'Register'}
                  </Link>
                </div>
              )}
              {featureFlags.offlineMode && (
                <button
                  type="button"
                  onClick={() => setShowOfflinePanel((prev) => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    showOfflinePanel
                      ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-slate-200 text-slate-500 hover:border-red-400 dark:border-slate-700 dark:text-slate-300'
                  }`}
                  aria-label={labels.offlineTitle}
                >
                  <HardDrive className="h-4 w-4" />
                </button>
              )}
              {featureFlags.accessibility && (
                <button
                  type="button"
                  onClick={() => setShowAccessibilityPanel((prev) => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    showAccessibilityPanel
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 text-slate-500 hover:border-red-400 dark:border-slate-700 dark:text-slate-300'
                  }`}
                  aria-label={labels.accessibilityTitle}
                >
                  <Accessibility className="h-4 w-4" />
                </button>
              )}
              {featureFlags.pushNotifications && (
                <button
                  type="button"
                  onClick={() => setShowNotificationsPanel((prev) => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    showNotificationsPanel
                      ? 'border-amber-400 bg-amber-50 text-amber-600'
                      : 'border-slate-200 text-slate-500 hover:border-red-400 dark:border-slate-700 dark:text-slate-300'
                  }`}
                  aria-label={labels.notificationsTitle}
                >
                  <Bell className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
              >
                {labels.languageToggle}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {(showOfflinePanel || showAccessibilityPanel || showNotificationsPanel) && (
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {showOfflinePanel && featureFlags.offlineMode && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {labels.offlineTitle}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{labels.offlineSubtitle}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      isOnline
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                    {isOnline ? labels.offlineStatusOnline : labels.offlineStatusOffline}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setOfflineEnabled((prev) => !prev)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      offlineEnabled
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      {labels.offlineEnable}
                    </span>
                    <span>{offlineEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOfflineDownload}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <span className="flex items-center gap-2">
                      <CloudDownload className="h-4 w-4" />
                      {labels.offlineDownload}
                    </span>
                  </button>

                  <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      {labels.offlineShowCached}
                    </span>
                    <input
                      type="checkbox"
                      checked={showCachedOnly}
                      onChange={(event) => setShowCachedOnly(event.target.checked)}
                      disabled={!offlineEnabled}
                      className="h-4 w-4 accent-red-500"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleClearOfflineCache}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    disabled={cachedStreams.length === 0}
                  >
                    {labels.offlineClearCache}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{labels.offlineCachedCount(cachedStreams.length)}</span>
                  <span>{labels.offlineDownloadDesc}</span>
                  {offlineSyncPending && <span>{labels.offlineSyncQueued}</span>}
                </div>
              </div>
            )}

            {showAccessibilityPanel && featureFlags.accessibility && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {labels.accessibilityTitle}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {labels.accessibilitySubtitle}
                    </p>
                  </div>
                  <Accessibility className="h-6 w-6 text-slate-400" />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setHighContrast((prev) => !prev)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      highContrast
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Contrast className="h-4 w-4" />
                      {labels.accessibilityHighContrast}
                    </span>
                    <span>{highContrast ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLargeText((prev) => !prev)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      largeText
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      {labels.accessibilityLargeText}
                    </span>
                    <span>{largeText ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReducedMotion((prev) => !prev)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      reducedMotion
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {labels.accessibilityReducedMotion}
                    </span>
                    <span>{reducedMotion ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{labels.accessibilityKeyboardHint}</span>
                  <span>{labels.accessibilityScreenReaderHint}</span>
                </div>
              </div>
            )}

            {showNotificationsPanel && featureFlags.pushNotifications && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {labels.notificationsTitle}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {labels.notificationsDesc}
                    </p>
                  </div>
                  <Bell className="h-6 w-6 text-slate-400" />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePushNotifications}
                    disabled={!pushSupported}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      pushEnabled
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <Bell className="h-4 w-4" />
                    {pushEnabled ? labels.notificationsDisable : labels.notificationsEnable}
                  </button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {pushSupported
                      ? pushEnabled
                        ? labels.notificationsStatusEnabled
                        : labels.notificationsStatusDisabled
                      : labels.notificationsUnsupported}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Top Ad Space */}
        {featureFlags.mainAds && topAds.length > 0 && (
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
        {featureFlags.mainHero && (
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800 dark:text-slate-100">
              {labels.welcomeTitle}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {labels.welcomeBody}
            </p>
          </div>
        )}

        {/* Search Bar */}
        {featureFlags.mainSearch && (
          <div className="mb-4 flex flex-col items-center gap-3">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={labels.searchPlaceholder}
                className="w-full pl-12 pr-24 py-3 text-lg border-2 border-slate-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {featureFlags.aiRecommendations && (
                  <button
                    type="button"
                    onClick={() => setShowAiPanel((prev) => !prev)}
                    className={`rounded-full border p-2 text-slate-500 transition ${
                      showAiPanel
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-600'
                        : 'border-slate-200 hover:border-red-400 dark:border-slate-700 dark:text-slate-300'
                    }`}
                    aria-label={labels.aiRecommendationsTitle}
                  >
                    <Bot className="h-4 w-4" />
                  </button>
                )}
                {featureFlags.mainFilters && (
                  <button
                    type="button"
                    onClick={() => setShowFiltersPanel((prev) => !prev)}
                    className={`rounded-full border p-2 text-slate-500 transition ${
                      showFiltersPanel
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : 'border-slate-200 hover:border-red-400 dark:border-slate-700 dark:text-slate-300'
                    }`}
                    aria-label={labels.filtersTitle}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showFiltersPanel && featureFlags.mainFilters && (
          <div className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORY_OPTIONS.filter((option) => option !== 'all').map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, category: option }))}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    filters.category === option
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-red-500 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  {labels.categoryOptions[option]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {labels.category}
                <select
                  value={filters.category}
                  onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {labels.categoryOptions[option]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {labels.language}
                <select
                  value={filters.language}
                  onChange={(event) => setFilters((prev) => ({ ...prev, language: event.target.value }))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {labels.languageOptions[option]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {labels.country}
                <select
                  value={filters.country}
                  onChange={(event) => setFilters((prev) => ({ ...prev, country: event.target.value }))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {labels.countryOptions[option]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilters({ category: 'all', language: 'all', country: 'all' })}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-red-500 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
              >
                {labels.resetFilters}
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {labels.filtersNote}
              </span>
            </div>
          </div>
        )}

        {showAiPanel && featureFlags.aiRecommendations && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {labels.aiRecommendationsTitle}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {labels.aiRecommendationsDesc}
                </p>
              </div>
              <Bot className="h-6 w-6 text-slate-400" />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {aiRecommendations.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {labels.aiRecommendationsEmpty}
                </p>
              ) : (
                aiRecommendations.map((stream) => (
                  <Link
                    key={stream.id}
                    href={`/stream/${stream.id}`}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    onClick={(event) => handleStreamClick(stream.id, event)}
                  >
                    <div className="font-semibold">{stream.title}</div>
                    <div className="text-xs text-slate-500">{stream.description ?? '—'}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {actionNotice && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            {actionNotice}
          </div>
        )}

        {offlineNotice && (
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
            {offlineNotice}
          </div>
        )}

        {featureFlags.userFeatures && (
          <div className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setShowUserFeatures((prev) => !prev)}
            className="flex w-full items-center justify-between gap-4 text-right"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {labels.userFeatures}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {labels.userFeaturesHint}
              </p>
            </div>
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition ${
                showUserFeatures
                  ? 'border-red-500 text-red-600'
                  : 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-300'
              }`}
              aria-hidden="true"
            >
              {showUserFeatures ? '−' : '+'}
            </span>
          </button>

          {showUserFeatures && (
            <div className="mt-6 space-y-10">
              {/* Favorites */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{labels.favorites}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {labels.favoritesDesc}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFavoritesOnly((prev) => !prev)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                        favoritesOnly
                          ? 'bg-amber-500 text-white'
                          : 'border border-slate-300 text-slate-600 hover:border-amber-400 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      {labels.favoritesOnly}
                    </button>
                    <button
                      type="button"
                      onClick={shareActiveList}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:border-red-400 dark:border-slate-700 dark:text-slate-300"
                    >
                      <Copy className="h-4 w-4" />
                      {labels.shareList}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-3">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {labels.favoritesList}
                      <select
                        value={activeFavoriteListId ?? ''}
                        onChange={(event) => setActiveFavoriteListId(event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {favoriteLists.length === 0 && <option value="">{labels.noLists}</option>}
                        {favoriteLists.map((list) => (
                          <option key={list.id} value={list.id}>
                            {list.name} ({list.streamIds.length})
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newListName}
                        onChange={(event) => setNewListName(event.target.value)}
                        placeholder={labels.newListPlaceholder}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                      <button
                        type="button"
                        onClick={createFavoriteList}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        {labels.createList}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      {labels.syncKey}
                      <input
                        type="text"
                        value={syncKey}
                        onChange={(event) => updateSyncKey(event.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {labels.syncHint}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recently Watched */}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{labels.recentlyWatched}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {labels.recentlyWatchedDesc}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {labels.totalWatch} {formatDuration(totalWatchTimeSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={clearRecentlyWatched}
                    className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-500 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    {labels.clearHistory}
                  </button>
                </div>
              </div>

              {recentlyWatched.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {labels.emptyHistory}
                </div>
              ) : (
                <div className="space-y-6">
                  {continueWatching.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{labels.continueWatching}</h4>
                        <span className="text-xs text-slate-400">{labels.lastStop}</span>
                      </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {continueWatching.map((entry) => (
                            <Link
                              key={entry.streamId}
                              href={`/stream/${entry.streamId}`}
                              className="group rounded-xl border border-slate-200 p-3 transition hover:border-red-400 dark:border-slate-800"
                            >
                              <div className="flex items-center gap-3">
                                {entry.thumbnail ? (
                                  <img
                                    src={entry.thumbnail}
                                    alt={entry.title}
                                    className="h-14 w-20 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-14 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
                                )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                              {entry.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {labels.lastStopAt(formatDuration(entry.lastPositionSeconds))}
                            </p>
                            <p className="text-xs text-amber-500">
                              {labels.watchDuration(formatDuration(entry.watchTimeSeconds))}
                            </p>
                          </div>
                        </div>
                      </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  {watchAgain.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{labels.watchAgain}</h4>
                        <span className="text-xs text-slate-400">{labels.latestChannels}</span>
                      </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                          {watchAgain.map((entry) => (
                            <Link
                              key={entry.streamId}
                              href={`/stream/${entry.streamId}`}
                              className="group text-center"
                            >
                              <div className="relative overflow-hidden rounded-lg border border-slate-200 shadow-sm transition group-hover:border-red-400 dark:border-slate-800">
                                {entry.thumbnail ? (
                                  <img
                                    src={entry.thumbnail}
                                    alt={entry.title}
                                    className="h-20 w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-20 w-full bg-slate-200 dark:bg-slate-800" />
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white">
                                  {formatDuration(entry.watchTimeSeconds)}
                                </div>
                              </div>
                              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                                {entry.title}
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}
          </div>
        )}

        <div className="mb-8">
          <Card className="border-dashed border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {labels.profileRecommendations}
              </p>
              <Link
                href={profileEmail ? '/profile' : '/register'}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-red-400 hover:text-red-600 dark:border-slate-700 dark:text-slate-300"
              >
                {labels.profileRecommendationsCta}
              </Link>
            </CardContent>
          </Card>
        </div>

        {featureFlags.engagementAnalytics && (
          <div className="mb-8">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
                    {labels.analyticsTitle}
                  </CardTitle>
                </div>
                <CardDescription>{labels.analyticsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500">{labels.analyticsVisits}</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {engagementMetrics.visits}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500">{labels.analyticsSearches}</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {engagementMetrics.searches}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500">{labels.analyticsOpens}</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {engagementMetrics.opens}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500">{labels.analyticsFavorites}</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {engagementMetrics.favorites}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500">{labels.analyticsShares}</p>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      {engagementMetrics.shares}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
        ) : sortedStreams.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Video className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">
                {labels.noChannels}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {labels.trySearch}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedStreams.map((stream) => {
              const status = streamStatuses.get(stream.id) ?? 'testing';
              const statusInfo = statusMeta[status];
              const primaryUrl = getPrimaryServerUrl(stream);
              const quality = getStreamQuality(primaryUrl, stream.title, stream.description ?? undefined);
              const resolution =
                extractResolutionFromUrl(primaryUrl) ||
                extractResolutionFromMetadata(`${stream.title} ${stream.description ?? ''}`) ||
                '—';
              const combinedMetadata = `${stream.title} ${stream.description ?? ''} ${primaryUrl}`;
              const fps = extractFps(combinedMetadata) ?? '—';
              const bitrate = extractBitrateMbps(combinedMetadata) ?? '—';
              const tierStyle = qualityBadgeStyles[quality.level] ?? qualityBadgeStyles.Unknown;

              return (
                <Link
                  key={stream.id}
                  href={`/stream/${stream.id}`}
                  className="group"
                  onClick={(event) => handleStreamClick(stream.id, event)}
                >
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-red-500">
                    <div className="relative aspect-video bg-slate-200 dark:bg-slate-800">
                      {featureFlags.featuredChannels && pinnedStreams.has(stream.id) && (
                        <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-yellow-500/90 px-2 py-1 text-xs font-semibold text-white shadow">
                          <Pin className="h-3 w-3" />
                          مميزة
                        </div>
                      )}
                      <div className="absolute top-2 left-2 z-10 group/status">
                        <div
                          className={`h-3 w-3 rounded-full shadow-lg ring-2 ring-white dark:ring-slate-900 ${statusInfo.className}`}
                          aria-label={statusInfo.label}
                        />
                        <div className="pointer-events-none absolute left-0 top-5 hidden min-w-[160px] rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover/status:block">
                          {statusInfo.label}
                        </div>
                      </div>
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
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        {featureFlags.quickActions && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              setOpenActionMenuId((prev) => (prev === stream.id ? null : stream.id));
                            }}
                            className="rounded-full bg-white/90 p-2 text-slate-600 shadow hover:text-red-500"
                            aria-label="Quick actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                        <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-md font-bold">
                          {labels.live}
                        </div>
                      </div>
                      {featureFlags.quickActions && openActionMenuId === stream.id && (
                        <div className="absolute right-2 top-12 z-20 w-44 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        {featureFlags.userFeatures && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              toggleFavorite(stream.id);
                              setOpenActionMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Star className="h-4 w-4 text-amber-500" />
                            {labels.addFavorite}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            copyStreamLink(stream);
                            setOpenActionMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Share2 className="h-4 w-4 text-slate-500" />
                          {labels.shareChannel}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            openInNewTab(stream);
                            setOpenActionMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <ExternalLink className="h-4 w-4 text-slate-500" />
                          {labels.openNewTab}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            reportBrokenChannel(stream);
                            setOpenActionMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Flag className="h-4 w-4" />
                          {labels.reportIssue}
                        </button>
                      </div>
                    )}
                      {featureFlags.userFeatures && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            toggleFavorite(stream.id);
                          }}
                          className={`absolute bottom-2 right-2 inline-flex items-center justify-center rounded-full p-2 shadow ${
                            activeFavoriteListId &&
                            favoriteLists.find((list) => list.id === activeFavoriteListId)?.streamIds.includes(stream.id)
                              ? 'bg-amber-500 text-white'
                              : 'bg-white/90 text-slate-600 hover:text-amber-500'
                          }`}
                          aria-label="Add to favorites"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
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
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className={`rounded-full px-2 py-0.5 ${quality.color}`}>
                          {quality.label}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 ${tierStyle}`}>
                          {resolution}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 ${tierStyle}`}>
                          {fps}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 ${tierStyle}`}>
                          {bitrate}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredStreams.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12 mb-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl hover:border-red-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="font-medium">{labels.previous}</span>
            </button>

            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700">
              <span className="text-lg font-bold text-slate-800 dark:text-white">
                {currentPage}
              </span>
              <span className="text-slate-600 dark:text-slate-400">{labels.from}</span>
              <span className="text-lg font-bold text-red-600">{totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium">{labels.next}</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {featureFlags.appsSection && (
          <div className="mt-12 mb-8">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-xl text-slate-800 dark:text-slate-100">
                    {labels.appsTitle}
                  </CardTitle>
                </div>
                <CardDescription>{labels.appsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                      <Smartphone className="h-4 w-4" />
                      {labels.appIos}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">TestFlight</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                      <Smartphone className="h-4 w-4" />
                      {labels.appAndroid}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Google Play</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                      <Tv className="h-4 w-4" />
                      {labels.appSamsung}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Samsung Store</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                      <Tv className="h-4 w-4" />
                      {labels.appLg}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">LG Content Store</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                      <Tv className="h-4 w-4" />
                      {labels.appAndroidTv}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Android TV Play</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Ad Space */}
        {featureFlags.mainAds && bottomAds.length > 0 && (
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
          <p>{labels.footer}</p>
        </div>
      </footer>
    </div>
  );
}
