'use client';

import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Tv,
  Users,
  Image as ImageIcon,
  Timer,
  BarChart3,
  Rows,
  CopyCheck,
  ImagePlus,
  Gauge,
  FolderTree,
  Database,
  MonitorPlay,
  ServerCog,
  SlidersHorizontal,
  Settings,
  Upload,
  LogOut,
  Plus,
  Pin,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Edit,
  MoreVertical,
  Menu,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  published: boolean;
  servers: Server[];
  categoryId?: string | null;
  playlistUrl?: string;
}

interface Server {
  id: string;
  streamId: string;
  name: string;
  url: string;
  priority: number;
  channelId?: string;
  channelName?: string;
  channelLogo?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  password?: string;
  theme?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Ad {
  id: string;
  streamId: string | null;
  position: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PlaylistChannel {
  channelId?: string;
  channelName?: string;
  logo?: string;
  url: string;
  duration?: number;
  groupTitle?: string;
}

interface QualityReport {
  status: 'success' | 'failed';
  message?: string;
  qualityLabel?: string;
  resolution?: string;
  bitrateKbps?: number;
  latencyMs?: number;
  bufferMs?: number;
}

interface PreviewReport {
  status: 'success' | 'failed';
  message?: string;
  codec?: string;
  resolution?: string;
  bitrateKbps?: number;
  latencyMs?: number;
}

interface ThumbnailSummary {
  updated: number;
  skipped: number;
  failed: number;
}

interface DuplicateServerGroup {
  url: string;
  group: Array<{ stream: Stream; server: Server }>;
}

type Tab =
  | 'streams'
  | 'users'
  | 'ads'
  | 'autoRefresh'
  | 'analytics'
  | 'batch'
  | 'duplicates'
  | 'thumbnails'
  | 'quality'
  | 'categories'
  | 'backup'
  | 'preview'
  | 'infrastructure'
  | 'abTesting'
  | 'featureFlags'
  | 'siteSettings';

type RefreshInterval = 'hourly' | 'daily' | 'weekly';

interface RefreshHistoryEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'failed';
  totalChannels: number;
  addedChannels: number;
  removedChannels: number;
  message?: string;
}

interface PlaylistRefreshConfig {
  id: string;
  name: string;
  url: string;
  interval: RefreshInterval;
  notifyEmail: string;
  lastRefreshedAt?: string;
  nextRefreshAt?: string;
  lastStatus?: 'success' | 'failed';
  lastError?: string;
  lastChannelCount?: number;
  channelUrls?: string[];
  history: RefreshHistoryEntry[];
}

interface Category {
  id: string;
  name: string;
  parentId?: string;
}

interface WebsiteFeatureFlags {
  featuredChannels: boolean;
  mainHero: boolean;
  mainSearch: boolean;
  mainFilters: boolean;
  mainAds: boolean;
  aiRecommendations: boolean;
  pushNotifications: boolean;
  engagementAnalytics: boolean;
  appsSection: boolean;
  offlineMode: boolean;
  accessibility: boolean;
  userFeatures: boolean;
  quickActions: boolean;
  liveChat: boolean;
  webRtc: boolean;
  profileAccount: boolean;
  profilePreferences: boolean;
  profileRecommendations: boolean;
  profileFavorites: boolean;
  profileHistory: boolean;
  streamRecommended: boolean;
  streamDescription: boolean;
  streamAdsTop: boolean;
  streamAdsBottom: boolean;
  streamAdsSidebar: boolean;
  streamServerSwitcher: boolean;
}

interface StreamRecommendationSettings {
  mode: 'auto' | 'manual';
  manualIds: string[];
}

interface AbTestVariant {
  name: string;
  ratio: number;
}

interface AbTest {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused';
  variants: AbTestVariant[];
}

interface SiteSettings {
  siteTitle: string;
  heroMessage: string;
  supportEmail: string;
  defaultTheme: 'dark' | 'light';
  faviconUrl?: string;
  appIconUrl?: string;
  primaryColor?: string;
  fontName?: string;
  fontUrl?: string;
  title?: string;
  popunderIntervalSeconds?: number;
  popunderMaxOpens?: number;
}

const WEBSITE_SETTINGS_KEY = 'websiteSettings';
const FEATURE_FLAGS_KEY = 'websiteFeatureFlags';
const STREAM_RECOMMENDATIONS_KEY = 'streamRecommendations';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('streams');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // Stream form state
  const [streamFormOpen, setStreamFormOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [streamForm, setStreamForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    categoryId: '',
    published: false,
    playlistUrl: '',
    serverUrls: ['', '', '', ''], // Array for unlimited servers
  });

  // Playlist parsing state
  const [parsedChannels, setParsedChannels] = useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<any[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Server form state
  const [serverFormOpen, setServerFormOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [serverForm, setServerForm] = useState({
    streamId: '',
    name: '',
    url: '',
    priority: 0,
  });

  // User form state
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user',
    theme: 'light',
  });

  // Ad form state
  const [adFormOpen, setAdFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adForm, setAdForm] = useState({
    streamId: '',
    position: 'home-top',
    title: '',
    imageUrl: '',
    linkUrl: '',
    active: true,
  });

  const [analyticsRange, setAnalyticsRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [streamsPage, setStreamsPage] = useState(1);
  const [pinnedStreams, setPinnedStreams] = useState<Set<string>>(new Set());
  const [selectedStreamIds, setSelectedStreamIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchUrlText, setBatchUrlText] = useState('');
  const [batchDeleteIds, setBatchDeleteIds] = useState('');
  const [batchMetaIds, setBatchMetaIds] = useState('');
  const [batchCategory, setBatchCategory] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [backupProcessing, setBackupProcessing] = useState(false);
  const [backupSchedule, setBackupSchedule] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [refreshForm, setRefreshForm] = useState({
    name: '',
    url: '',
    interval: 'daily' as RefreshInterval,
    notifyEmail: '',
  });
  const [refreshConfigs, setRefreshConfigs] = useState<PlaylistRefreshConfig[]>([]);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [editingRefresh, setEditingRefresh] = useState<PlaylistRefreshConfig | null>(null);
  const [duplicateProcessing, setDuplicateProcessing] = useState(false);
  const [duplicateStreamGroups, setDuplicateStreamGroups] = useState<Stream[][]>([]);
  const [duplicateServerGroups, setDuplicateServerGroups] = useState<DuplicateServerGroup[]>([]);
  const [mergePrimaryId, setMergePrimaryId] = useState('');
  const [thumbnailProcessing, setThumbnailProcessing] = useState(false);
  const [thumbnailSummary, setThumbnailSummary] = useState<ThumbnailSummary | null>(null);
  const [qualityUrl, setQualityUrl] = useState('');
  const [qualityProcessing, setQualityProcessing] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewStreamId, setPreviewStreamId] = useState('');
  const [previewReport, setPreviewReport] = useState<PreviewReport | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryParentId, setCategoryParentId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featureFlags, setFeatureFlags] = useState<WebsiteFeatureFlags>({
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
    profileAccount: true,
    profilePreferences: true,
    profileRecommendations: true,
    profileFavorites: true,
    profileHistory: true,
    streamRecommended: true,
    streamDescription: true,
    streamAdsTop: true,
    streamAdsBottom: true,
    streamAdsSidebar: true,
    streamServerSwitcher: true,
  });
  const [streamRecommendations, setStreamRecommendations] = useState<StreamRecommendationSettings>({
    mode: 'auto',
    manualIds: [],
  });
  const [streamSearchQuery, setStreamSearchQuery] = useState('');
  const [abTests, setAbTests] = useState<AbTest[]>([
    {
      id: 'server-routing',
      name: 'توزيع الخوادم الذكي',
      description: 'اختبار موازنة جديدة بين خوادم البث.',
      status: 'running',
      variants: [
        { name: 'الخطة A', ratio: 50 },
        { name: 'الخطة B', ratio: 50 },
      ],
    },
    {
      id: 'player-ui',
      name: 'واجهة المشغل',
      description: 'مقارنة بين تصميمي مشغل البث.',
      status: 'paused',
      variants: [
        { name: 'واجهة كلاسيكية', ratio: 70 },
        { name: 'واجهة حديثة', ratio: 30 },
      ],
    },
  ]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteTitle: 'F2L Streaming',
    heroMessage: 'أفضل بث مباشر بجودة عالية.',
    supportEmail: 'support@f2l.local',
    defaultTheme: 'dark',
    faviconUrl: '',
    appIconUrl: '',
    popunderIntervalSeconds: 120,
    popunderMaxOpens: 3,
  });
  const [autoScalingConfig, setAutoScalingConfig] = useState({
    minServers: 2,
    maxServers: 10,
    targetLoad: 70,
  });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [streamStatus, setStreamStatus] = useState<Map<string, 'working' | 'broken'>>(new Map());

  const streamsPerPage = 6;
  const sortedStreams = [...streams].sort((a, b) => {
    const aPinned = pinnedStreams.has(a.id) ? 1 : 0;
    const bPinned = pinnedStreams.has(b.id) ? 1 : 0;
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    return a.title.localeCompare(b.title, 'ar');
  });
  const normalizedSearch = streamSearchQuery.trim().toLowerCase();
  const filteredStreams = sortedStreams.filter((stream) => {
    if (!normalizedSearch) return true;
    const haystack = `${stream.title} ${stream.description ?? ''} ${stream.id}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });
  const totalStreamPages = Math.max(1, Math.ceil(filteredStreams.length / streamsPerPage));
  const paginatedStreams = filteredStreams.slice(
    (streamsPage - 1) * streamsPerPage,
    streamsPage * streamsPerPage
  );

  const analyticsCards = [
    {
      label: 'إجمالي المشاهدات',
      value: (streams.length * (analyticsRange === '24h' ? 1200 : analyticsRange === '7d' ? 5600 : 19000)).toLocaleString('ar'),
      delta: analyticsRange === '24h' ? '+3.2%' : analyticsRange === '7d' ? '+8.4%' : '+12.7%',
    },
    {
      label: 'عدد المشاهدين',
      value: (streams.length * (analyticsRange === '24h' ? 320 : analyticsRange === '7d' ? 1600 : 5200)).toLocaleString('ar'),
      delta: analyticsRange === '24h' ? '+1.8%' : analyticsRange === '7d' ? '+4.5%' : '+9.1%',
    },
    {
      label: 'معدل التشغيل',
      value: analyticsRange === '24h' ? '96.2%' : analyticsRange === '7d' ? '97.1%' : '97.8%',
      delta: '+0.4%',
    },
    {
      label: 'الانقطاعات',
      value: analyticsRange === '24h' ? '4' : analyticsRange === '7d' ? '12' : '21',
      delta: '-1.3%',
    },
  ];

  const topChannels = streams.slice(0, 5).map((stream, index) => ({
    name: stream.title,
    views: 12000 - index * 1200,
    change: `+${Math.max(1, 8 - index)}%`,
  }));

  const activityLogs = [
    { id: '1', action: 'تحديث بيانات القنوات', user: 'المشرف الرئيسي', time: 'قبل 12 دقيقة' },
    { id: '2', action: 'إضافة إعلان جديد', user: 'فريق المحتوى', time: 'قبل 40 دقيقة' },
    { id: '3', action: 'مراجعة تنبيه الأداء', user: 'عمليات البث', time: 'قبل ساعتين' },
  ];

  const uptimeStats = [
    { server: 'CDN الشرق الأوسط', uptime: '99.8%', incidents: 1 },
    { server: 'CDN أوروبا', uptime: '99.5%', incidents: 2 },
    { server: 'CDN أمريكا', uptime: '99.1%', incidents: 3 },
  ];

  const peakUsage = [
    { label: '09:00 - 12:00', value: '65%' },
    { label: '12:00 - 15:00', value: '82%' },
    { label: '15:00 - 18:00', value: '74%' },
    { label: '18:00 - 21:00', value: '91%' },
  ];

  const featureFlagSections: Array<{
    title: string;
    description: string;
    flags: Array<{ key: keyof WebsiteFeatureFlags; name: string; description: string }>;
  }> = [
    {
      title: 'ميزات الصفحة الرئيسية',
      description: 'تحكم في الوحدات الظاهرة في الصفحة الرئيسية.',
      flags: [
        {
          key: 'featuredChannels',
          name: 'القنوات المميزة',
          description: 'إبراز القنوات المثبتة كقنوات مميزة في الصفحة الرئيسية.',
        },
        {
          key: 'mainHero',
          name: 'رسالة الترحيب',
          description: 'عرض رسالة الترحيب في أعلى الصفحة الرئيسية.',
        },
        {
          key: 'mainSearch',
          name: 'شريط البحث',
          description: 'إظهار شريط البحث عن القنوات في الصفحة الرئيسية.',
        },
        {
          key: 'mainFilters',
          name: 'مرشحات القنوات',
          description: 'إظهار فلاتر التصنيف واللغة والدولة.',
        },
        {
          key: 'mainAds',
          name: 'إعلانات الصفحة الرئيسية',
          description: 'عرض مساحات الإعلانات في أعلى الصفحة الرئيسية.',
        },
        {
          key: 'aiRecommendations',
          name: 'توصيات الذكاء الاصطناعي',
          description: 'إظهار لوحة التوصيات الذكية.',
        },
        {
          key: 'appsSection',
          name: 'قسم التطبيقات',
          description: 'عرض قسم تطبيقات المنصة.',
        },
        {
          key: 'offlineMode',
          name: 'الوضع غير المتصل',
          description: 'إتاحة تنزيل القنوات للمشاهدة دون اتصال.',
        },
        {
          key: 'accessibility',
          name: 'إعدادات الوصول',
          description: 'عرض خيارات تباين عالي وحجم الخط.',
        },
        {
          key: 'pushNotifications',
          name: 'الإشعارات',
          description: 'إظهار إعدادات إشعارات المتصفح.',
        },
        {
          key: 'engagementAnalytics',
          name: 'تحليلات التفاعل',
          description: 'عرض بطاقات التفاعل في لوحة الصفحة الرئيسية.',
        },
        {
          key: 'userFeatures',
          name: 'ميزات المستخدم',
          description: 'إظهار أدوات المفضلات والتفاعل السريع.',
        },
        {
          key: 'quickActions',
          name: 'القائمة السريعة',
          description: 'إظهار إجراءات سريعة لكل قناة.',
        },
        {
          key: 'liveChat',
          name: 'الدردشة المباشرة',
          description: 'عرض أداة الدردشة داخل الصفحة الرئيسية.',
        },
        {
          key: 'webRtc',
          name: 'WebRTC',
          description: 'تمكين معاينات WebRTC التجريبية.',
        },
      ],
    },
    {
      title: 'ميزات الملف الشخصي',
      description: 'التحكم في أقسام صفحة الملف الشخصي.',
      flags: [
        {
          key: 'profileAccount',
          name: 'معلومات الحساب',
          description: 'إظهار بطاقة معلومات الحساب وصورة الملف.',
        },
        {
          key: 'profilePreferences',
          name: 'التفضيلات',
          description: 'إظهار إعدادات اللغة والثيم.',
        },
        {
          key: 'profileRecommendations',
          name: 'التوصيات',
          description: 'عرض توصيات القنوات في الملف الشخصي.',
        },
        {
          key: 'profileFavorites',
          name: 'قوائم المفضلة',
          description: 'عرض قوائم المفضلة في الملف الشخصي.',
        },
        {
          key: 'profileHistory',
          name: 'سجل المشاهدة',
          description: 'عرض سجل القنوات التي تمت مشاهدتها.',
        },
      ],
    },
    {
      title: 'ميزات صفحة البث',
      description: 'التحكم في أقسام صفحة مشاهدة القناة.',
      flags: [
        {
          key: 'streamServerSwitcher',
          name: 'مبدّل الخوادم',
          description: 'إظهار اختيار السيرفرات المتاحة.',
        },
        {
          key: 'streamDescription',
          name: 'وصف القناة',
          description: 'عرض وصف القناة أسفل المشغل.',
        },
        {
          key: 'streamRecommended',
          name: 'القنوات الموصى بها',
          description: 'عرض قنوات موصى بها أسفل البث.',
        },
        {
          key: 'streamAdsTop',
          name: 'إعلانات أعلى البث',
          description: 'عرض إعلانات أعلى المشغل.',
        },
        {
          key: 'streamAdsBottom',
          name: 'إعلانات أسفل البث',
          description: 'عرض إعلانات أسفل المشغل.',
        },
        {
          key: 'streamAdsSidebar',
          name: 'إعلانات جانبية',
          description: 'إظهار الإعلانات الجانبية بجانب البث.',
        },
      ],
    },
  ];

  useEffect(() => {
    const storedPins = localStorage.getItem('pinnedStreams');
    if (storedPins) {
      setPinnedStreams(new Set(JSON.parse(storedPins)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pinnedStreams', JSON.stringify([...pinnedStreams]));
  }, [pinnedStreams]);

  useEffect(() => {
    const storedSettings = localStorage.getItem(WEBSITE_SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings) as SiteSettings;
        setSiteSettings((prev) => ({
          ...prev,
          ...parsed,
          siteTitle: parsed.siteTitle ?? parsed.title ?? prev.siteTitle,
        }));
      } catch (error) {
        console.error('Error parsing site settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    const storedFlags = localStorage.getItem(FEATURE_FLAGS_KEY);
    if (storedFlags) {
      try {
        const parsed = JSON.parse(storedFlags) as Partial<WebsiteFeatureFlags>;
        setFeatureFlags((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error parsing feature flags:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(featureFlags));
    window.dispatchEvent(new Event('featureFlagsUpdated'));
  }, [featureFlags]);

  useEffect(() => {
    const storedRecommendations = localStorage.getItem(STREAM_RECOMMENDATIONS_KEY);
    if (storedRecommendations) {
      try {
        const parsed = JSON.parse(storedRecommendations) as StreamRecommendationSettings;
        if (parsed.mode === 'manual' || parsed.mode === 'auto') {
          setStreamRecommendations({
            mode: parsed.mode,
            manualIds: Array.isArray(parsed.manualIds) ? parsed.manualIds : [],
          });
        }
      } catch (error) {
        console.error('Error parsing stream recommendations:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STREAM_RECOMMENDATIONS_KEY, JSON.stringify(streamRecommendations));
  }, [streamRecommendations]);

  useEffect(() => {
    localStorage.setItem(
      WEBSITE_SETTINGS_KEY,
      JSON.stringify({ ...siteSettings, title: siteSettings.siteTitle })
    );
  }, [siteSettings]);

  useEffect(() => {
    setStreamsPage((prev) => Math.min(prev, totalStreamPages));
  }, [totalStreamPages]);

  useEffect(() => {
    setStreamsPage(1);
  }, [streamSearchQuery]);

  useEffect(() => {
    const normalizedMap = new Map<string, Stream[]>();
    streams.forEach((stream) => {
      const key = stream.title.toLowerCase().replace(/\s+/g, ' ').trim();
      const group = normalizedMap.get(key) ?? [];
      group.push(stream);
      normalizedMap.set(key, group);
    });
    setDuplicateStreamGroups(
      Array.from(normalizedMap.values()).filter((group) => group.length > 1)
    );

    const serverMap = new Map<string, Array<{ stream: Stream; server: Server }>>();
    streams.forEach((stream) => {
      stream.servers.forEach((server) => {
        if (!server.url) return;
        const group = serverMap.get(server.url) ?? [];
        group.push({ stream, server });
        serverMap.set(server.url, group);
      });
    });
    setDuplicateServerGroups(
      Array.from(serverMap.entries())
        .filter(([, group]) => group.length > 1)
        .map(([url, group]) => ({ url, group }))
    );
  }, [streams]);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [activeTab]);

  const checkAuth = () => {
    const adminUser = localStorage.getItem('adminUser');
    if (!adminUser) {
      window.location.href = '/admin-portal-secure-2025-x7k9m2';
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const streamResponse = await fetch('/api/streams');
      const streamData = await streamResponse.json();
      setStreams(streamData);

      if (activeTab === 'users') {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } else if (activeTab === 'ads') {
        const response = await fetch('/api/ads');
        const data = await response.json();
        setAds(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    window.location.href = '/admin-portal-secure-2025-x7k9m2';
  };

  const togglePinStream = (streamId: string) => {
    setPinnedStreams((prev) => {
      const next = new Set(prev);
      if (next.has(streamId)) {
        next.delete(streamId);
      } else {
        next.add(streamId);
      }
      return next;
    });
  };

  const toggleManualRecommendation = (streamId: string) => {
    setStreamRecommendations((prev) => {
      const exists = prev.manualIds.includes(streamId);
      if (!exists && prev.manualIds.length >= 2) {
        toast.error('يمكن اختيار قناتين فقط كحد أقصى.');
        return prev;
      }
      return {
        ...prev,
        manualIds: exists
          ? prev.manualIds.filter((id) => id !== streamId)
          : [...prev.manualIds, streamId],
      };
    });
  };

  const toggleStreamSelection = (streamId: string) => {
    setSelectedStreamIds((prev) => {
      const next = new Set(prev);
      if (next.has(streamId)) {
        next.delete(streamId);
      } else {
        next.add(streamId);
      }
      return next;
    });
  };

  const getPrimaryServerUrl = (stream: Stream) => stream.servers[0]?.url || '';

  const getStreamQuality = (url: string, title?: string | null, description?: string | null) => {
    const normalized = `${url} ${title ?? ''} ${description ?? ''}`.toLowerCase();
    if (normalized.includes('2160') || normalized.includes('4k')) {
      return { level: '4K', label: 'Ultra HD' };
    }
    if (normalized.includes('1080') || normalized.includes('fhd')) {
      return { level: 'FHD', label: 'Full HD' };
    }
    if (normalized.includes('720') || normalized.includes('hd')) {
      return { level: 'HD', label: 'HD' };
    }
    if (normalized.includes('480') || normalized.includes('sd')) {
      return { level: 'SD', label: 'SD' };
    }
    return { level: 'Unknown', label: 'غير معروف' };
  };

  const formatQualityInfo = (quality: { level: string; label: string }) => {
    const map: Record<string, { className: string; icon: string; label: string }> = {
      '4K': { className: 'text-purple-300', icon: '4K', label: '4K' },
      FHD: { className: 'text-emerald-300', icon: 'FHD', label: 'Full HD' },
      HD: { className: 'text-blue-300', icon: 'HD', label: 'HD' },
      SD: { className: 'text-yellow-300', icon: 'SD', label: 'SD' },
    };
    return map[quality.level] ?? { className: 'text-slate-400', icon: '•', label: quality.label };
  };

  const handleDeleteRefreshConfig = (configId: string) => {
    setRefreshConfigs((prev) => prev.filter((config) => config.id !== configId));
    if (editingRefresh?.id === configId) {
      setEditingRefresh(null);
      setRefreshForm({
        name: '',
        url: '',
        interval: 'daily',
        notifyEmail: '',
      });
    }
    toast.success('تم حذف جدول التحديث');
  };

  const handleEditRefreshConfig = (config: PlaylistRefreshConfig) => {
    setEditingRefresh(config);
    setRefreshForm({
      name: config.name,
      url: config.url,
      interval: config.interval,
      notifyEmail: config.notifyEmail,
    });
  };

  const handleSaveRefreshConfig = () => {
    if (!refreshForm.name || !refreshForm.url) {
      toast.error('الرجاء إدخال الاسم والرابط');
      return;
    }
    const id =
      editingRefresh?.id ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `refresh-${Date.now()}`);
    const nextRefreshAt = new Date();
    if (refreshForm.interval === 'hourly') {
      nextRefreshAt.setHours(nextRefreshAt.getHours() + 1);
    } else if (refreshForm.interval === 'daily') {
      nextRefreshAt.setDate(nextRefreshAt.getDate() + 1);
    } else {
      nextRefreshAt.setDate(nextRefreshAt.getDate() + 7);
    }

    const newConfig: PlaylistRefreshConfig = {
      id,
      name: refreshForm.name,
      url: refreshForm.url,
      interval: refreshForm.interval,
      notifyEmail: refreshForm.notifyEmail,
      lastRefreshedAt: editingRefresh?.lastRefreshedAt,
      nextRefreshAt: nextRefreshAt.toISOString(),
      lastStatus: editingRefresh?.lastStatus,
      lastError: editingRefresh?.lastError,
      lastChannelCount: editingRefresh?.lastChannelCount,
      channelUrls: editingRefresh?.channelUrls,
      history: editingRefresh?.history ?? [],
    };

    setRefreshConfigs((prev) => {
      if (editingRefresh) {
        return prev.map((config) => (config.id === editingRefresh.id ? newConfig : config));
      }
      return [newConfig, ...prev];
    });
    setEditingRefresh(null);
    setRefreshForm({
      name: '',
      url: '',
      interval: 'daily',
      notifyEmail: '',
    });
    toast.success(editingRefresh ? 'تم تحديث الجدول' : 'تم إضافة جدول جديد');
  };

  const refreshPlaylist = async (config: PlaylistRefreshConfig) => {
    setRefreshingIds((prev) => new Set(prev).add(config.id));
    try {
      const response = await fetch(config.url);
      if (!response.ok) {
        throw new Error('فشل في تحميل القائمة');
      }
      const content = await response.text();
      const urls = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
      const totalChannels = urls.length;
      const lastCount = config.lastChannelCount ?? 0;
      const addedChannels = Math.max(0, totalChannels - lastCount);
      const removedChannels = Math.max(0, lastCount - totalChannels);
      const timestamp = new Date().toISOString();

      const historyEntry: RefreshHistoryEntry = {
        id: `history-${Date.now()}`,
        timestamp,
        status: 'success',
        totalChannels,
        addedChannels,
        removedChannels,
        message: 'تم تحديث القائمة',
      };

      setRefreshConfigs((prev) =>
        prev.map((item) =>
          item.id === config.id
            ? {
                ...item,
                lastRefreshedAt: timestamp,
                nextRefreshAt: new Date(
                  Date.now() +
                    (config.interval === 'hourly'
                      ? 60 * 60 * 1000
                      : config.interval === 'daily'
                      ? 24 * 60 * 60 * 1000
                      : 7 * 24 * 60 * 60 * 1000)
                ).toISOString(),
                lastStatus: 'success',
                lastError: undefined,
                lastChannelCount: totalChannels,
                channelUrls: urls,
                history: [historyEntry, ...item.history],
              }
            : item
        )
      );
      toast.success('تم تحديث القائمة بنجاح');
    } catch (error) {
      const timestamp = new Date().toISOString();
      setRefreshConfigs((prev) =>
        prev.map((item) =>
          item.id === config.id
            ? {
                ...item,
                lastRefreshedAt: timestamp,
                lastStatus: 'failed',
                lastError: error instanceof Error ? error.message : 'فشل التحديث',
                history: [
                  {
                    id: `history-${Date.now()}`,
                    timestamp,
                    status: 'failed',
                    totalChannels: 0,
                    addedChannels: 0,
                    removedChannels: 0,
                    message: error instanceof Error ? error.message : 'فشل التحديث',
                  },
                  ...item.history,
                ],
              }
            : item
        )
      );
      toast.error('فشل تحديث القائمة');
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(config.id);
        return next;
      });
    }
  };

  const handleExportAnalytics = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      range: analyticsRange,
      cards: analyticsCards,
      topChannels,
      uptimeStats,
      peakUsage,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${analyticsRange}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('تم تنزيل بيانات التحليلات');
  };

  const handleExportBackup = (format: 'json' | 'sql') => {
    setBackupProcessing(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        streams,
        users,
        ads,
        categories,
        backupSchedule,
      };
      const data =
        format === 'json'
          ? JSON.stringify(payload, null, 2)
          : `-- Backup generated at ${payload.exportedAt}\n-- Streams: ${streams.length}\n-- Users: ${users.length}\n-- Ads: ${ads.length}\n`;
      const blob = new Blob([data], {
        type: format === 'json' ? 'application/json' : 'text/plain',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup.${format === 'json' ? 'json' : 'sql'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setLastBackupAt(payload.exportedAt);
      toast.success('تم تصدير النسخة الاحتياطية');
    } catch (error) {
      toast.error('فشل تصدير النسخة الاحتياطية');
    } finally {
      setBackupProcessing(false);
    }
  };

  const handleImportBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackupProcessing(true);
    try {
      const content = await file.text();
      const payload = JSON.parse(content);
      if (payload.streams) {
        setStreams(payload.streams);
      }
      if (payload.users) {
        setUsers(payload.users);
      }
      if (payload.ads) {
        setAds(payload.ads);
      }
      if (payload.categories) {
        setCategories(payload.categories);
      }
      if (payload.backupSchedule) {
        setBackupSchedule(payload.backupSchedule);
      }
      setLastBackupAt(new Date().toISOString());
      toast.success('تم استيراد النسخة الاحتياطية');
    } catch (error) {
      toast.error('فشل استيراد النسخة الاحتياطية');
    } finally {
      setBackupProcessing(false);
      event.target.value = '';
    }
  };

  const handleExportChannels = () => {
    const headers = ['id', 'title', 'description', 'published', 'primaryUrl'];
    const rows = streams.map((stream) => [
      stream.id,
      stream.title,
      stream.description ?? '',
      stream.published ? '1' : '0',
      getPrimaryServerUrl(stream),
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'streams.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('تم تصدير القنوات');
  };

  const handleImportBatchFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setBatchUrlText(text);
    toast.success('تم تحميل الملف');
  };

  const handleBatchUrlUpdate = async () => {
    if (!batchUrlText.trim()) {
      toast.error('أدخل بيانات التحديث أولاً');
      return;
    }
    setBatchProcessing(true);
    try {
      const updates = batchUrlText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(',').map((part) => part.trim()))
        .filter((parts) => parts.length >= 2)
        .map(([id, url]) => ({ id, url }));

      await Promise.all(
        updates.map((update) =>
          fetch('/api/servers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: update.id, url: update.url }),
          })
        )
      );
      toast.success('تم تحديث الروابط');
      setBatchUrlText('');
      await fetchData();
    } catch (error) {
      toast.error('فشل تحديث الروابط');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchDeleteStreams = async () => {
    if (!batchDeleteIds.trim()) {
      toast.error('أدخل معرفات القنوات أولاً');
      return;
    }
    setBatchProcessing(true);
    try {
      const ids = batchDeleteIds.split(',').map((id) => id.trim()).filter(Boolean);
      await Promise.all(ids.map((id) => fetch(`/api/streams/${id}`, { method: 'DELETE' })));
      toast.success('تم حذف القنوات المحددة');
      setBatchDeleteIds('');
      await fetchData();
    } catch (error) {
      toast.error('فشل حذف القنوات');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchMetadataUpdate = async () => {
    if (!batchMetaIds.trim()) {
      toast.error('أدخل معرفات القنوات أولاً');
      return;
    }
    setBatchProcessing(true);
    try {
      const ids = batchMetaIds.split(',').map((id) => id.trim()).filter(Boolean);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/streams/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId: batchCategory || undefined,
              description: batchDescription || undefined,
            }),
          })
        )
      );
      toast.success('تم تحديث بيانات القنوات');
      setBatchMetaIds('');
      setBatchCategory('');
      setBatchDescription('');
      await fetchData();
    } catch (error) {
      toast.error('فشل تحديث بيانات القنوات');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBulkAssignCategory = async (categoryId: string) => {
    if (selectedStreamIds.size === 0) {
      toast.error('حدد قنوات أولاً');
      return;
    }
    setBatchProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedStreamIds).map((id) =>
          fetch(`/api/streams/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId }),
          })
        )
      );
      setSelectedStreamIds(new Set());
      toast.success('تم تطبيق التصنيف');
      await fetchData();
    } catch (error) {
      toast.error('فشل تطبيق التصنيف');
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleCategoryDrop = async (
    event: DragEvent<HTMLDivElement>,
    categoryId?: string
  ) => {
    event.preventDefault();
    const streamId = event.dataTransfer.getData('text/plain');
    if (!streamId) return;
    try {
      await fetch(`/api/streams/${streamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryId || null }),
      });
      setStreams((prev) =>
        prev.map((stream) =>
          stream.id === streamId ? { ...stream, categoryId: categoryId || null } : stream
        )
      );
      toast.success('تم تحديث التصنيف');
    } catch (error) {
      toast.error('فشل تحديث التصنيف');
    }
  };

  const handleMergeDuplicates = async (primaryId: string, duplicateIds: string[]) => {
    if (duplicateIds.length === 0) return;
    setDuplicateProcessing(true);
    try {
      const primaryStream = streams.find((stream) => stream.id === primaryId);
      let priorityBase = primaryStream?.servers.length ?? 0;
      const duplicates = streams.filter((stream) => duplicateIds.includes(stream.id));
      const serverCreates = duplicates.flatMap((stream) =>
        stream.servers.map((server) => ({
          streamId: primaryId,
          name: server.name || `الخادم ${priorityBase + 1}`,
          url: server.url,
          priority: priorityBase++,
        }))
      );
      await Promise.all(
        serverCreates.map((server) =>
          fetch('/api/servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(server),
          })
        )
      );
      await Promise.all(
        duplicateIds.map((id) => fetch(`/api/streams/${id}`, { method: 'DELETE' }))
      );
      toast.success('تم دمج التكرارات');
      await fetchData();
    } catch (error) {
      toast.error('فشل دمج التكرارات');
    } finally {
      setDuplicateProcessing(false);
    }
  };

  const handleMergeAllDuplicates = async () => {
    for (const group of duplicateStreamGroups) {
      const primaryId = mergePrimaryId || group[0].id;
      const duplicateIds = group.map((stream) => stream.id).filter((id) => id !== primaryId);
      if (duplicateIds.length > 0) {
        await handleMergeDuplicates(primaryId, duplicateIds);
      }
    }
  };

  const handleRegenerateThumbnails = (includeExisting: boolean) => {
    setThumbnailProcessing(true);
    try {
      let updated = 0;
      let skipped = 0;
      setStreams((prev) =>
        prev.map((stream) => {
          if (!includeExisting && stream.thumbnail) {
            skipped += 1;
            return stream;
          }
          updated += 1;
          return {
            ...stream,
            thumbnail:
              stream.thumbnail && includeExisting
                ? `${stream.thumbnail}?refresh=${Date.now()}`
                : stream.thumbnail || `https://placehold.co/600x400?text=${encodeURIComponent(stream.title)}`,
          };
        })
      );
      setThumbnailSummary({ updated, skipped, failed: 0 });
      toast.success('تم تحديث الصور المصغرة');
    } catch (error) {
      setThumbnailSummary({ updated: 0, skipped: 0, failed: streams.length });
      toast.error('فشل تحديث الصور المصغرة');
    } finally {
      setThumbnailProcessing(false);
    }
  };

  const handleQualityTest = async () => {
    if (!qualityUrl.trim()) {
      toast.error('أدخل رابط البث');
      return;
    }
    setQualityProcessing(true);
    try {
      const response = await fetch('/api/admin/quality-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: qualityUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل اختبار الجودة');
      }
      setQualityReport({
        status: 'success',
        qualityLabel: data.qualityLabel,
        resolution: data.resolution,
        bitrateKbps: data.bitrateKbps,
        latencyMs: data.latencyMs,
        bufferMs: data.bufferMs,
      });
    } catch (error) {
      setQualityReport({
        status: 'failed',
        message: error instanceof Error ? error.message : 'فشل اختبار الجودة',
      });
    } finally {
      setQualityProcessing(false);
    }
  };

  const handlePreviewMetadata = async () => {
    const selectedStream = streams.find((stream) => stream.id === previewStreamId);
    const url = previewUrl || selectedStream?.servers[0]?.url;
    if (!url) {
      toast.error('أدخل رابط البث');
      return;
    }
    setPreviewUrl(url);
    try {
      const response = await fetch('/api/admin/preview-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل جلب بيانات البث');
      }
      setPreviewReport({
        status: 'success',
        codec: data.codec,
        resolution: data.resolution,
        bitrateKbps: data.bitrateKbps,
        latencyMs: data.latencyMs,
      });
    } catch (error) {
      setPreviewReport({
        status: 'failed',
        message: error instanceof Error ? error.message : 'فشل جلب بيانات البث',
      });
    }
  };

  const checkAllStreamStatus = async () => {
    if (streams.length === 0) {
      toast.error('لا يوجد قنوات للفحص');
      return;
    }

    setCheckingStatus(true);
    setStreamStatus(new Map());

    try {
      const streamIds = streams.map((stream) => stream.id);
      const response = await fetch('/api/channels/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Status check failed');
      }

      const statusMap = new Map<string, 'working' | 'broken'>();
      data.results.forEach((result: { streamId: string; status: 'working' | 'broken' }) => {
        statusMap.set(result.streamId, result.status);
      });

      setStreamStatus(statusMap);
      toast.success(`تم فحص ${data.results.length} قناة`);
    } catch (error) {
      console.error('Error checking status:', error);
      toast.error(error instanceof Error ? error.message : 'فشل في فحص القنوات');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Stream operations
  const handleCreateStream = async () => {
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...streamForm,
          authorId: adminUser.id,
          playlistUrl: streamForm.playlistUrl,
        }),
      });
      if (!response.ok) throw new Error('Failed to create stream');

      const stream = await response.json();

      // Create servers if URLs are provided
      const serverPromises = [];
      streamForm.serverUrls.forEach((url, index) => {
        if (url && url.trim()) {
          serverPromises.push(
            fetch('/api/servers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                streamId: stream.id,
                name: `الخادم ${index + 1}`,
                url: url.trim(),
                priority: index,
              }),
            })
          );
        }
      });

      await Promise.all(serverPromises);

      toast.success('تم إنشاء البث بنجاح');
      setStreamFormOpen(false);
      resetStreamForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في إنشاء البث');
    }
  };

  const handleUpdateStream = async () => {
    if (!editingStream) return;
    try {
      const response = await fetch(`/api/streams/${editingStream.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamForm),
      });
      if (!response.ok) throw new Error('Failed to update stream');
      toast.success('تم تحديث البث بنجاح');
      setStreamFormOpen(false);
      setEditingStream(null);
      resetStreamForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في تحديث البث');
    }
  };

  const handleDeleteStream = async (id: string) => {
    try {
      await fetch(`/api/streams/${id}`, { method: 'DELETE' });
      toast.success('تم حذف البث بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل في حذف البث');
    }
  };

  const openStreamForm = (stream?: Stream) => {
    if (stream) {
      setEditingStream(stream);
      // Extract server URLs from the stream's servers
      const serverUrls = stream.servers.map(server => server.url);
      setStreamForm({
        title: stream.title,
        description: stream.description || '',
        thumbnail: stream.thumbnail || '',
        categoryId: '',
        published: stream.published,
        playlistUrl: stream.playlistUrl || '',
        serverUrls: serverUrls.length > 0 ? serverUrls : ['', '', '', ''],
      });
    } else {
      setEditingStream(null);
      resetStreamForm();
    }
    setStreamFormOpen(true);
  };

  const resetStreamForm = () => {
    setStreamForm({
      title: '',
      description: '',
      thumbnail: '',
      categoryId: '',
      published: false,
      playlistUrl: '',
      serverUrls: ['', '', '', ''], // Reset to 4 empty servers
    });
    setParsedChannels([]);
    setSelectedChannels([]);
  };

  // Parse M3U playlist
  const handleParsePlaylist = async () => {
    if (!streamForm.playlistUrl) {
      toast.error('الرجا إدخال رابط ملف M3U');
      return;
    }

    setLoadingChannels(true);
    try {
      const response = await fetch(streamForm.playlistUrl);
      if (!response.ok) {
        throw new Error('فشل في تحميل ملف القائمة');
      }

      const content = await response.text();
      const channels: PlaylistChannel[] = [];
      const lines = content.split('\n');
      let currentChannel: Partial<PlaylistChannel> = {};

      const getAttribute = (line: string, attribute: string) => {
        const match = line.match(new RegExp(`${attribute}="(.*?)"`));
        return match?.[1];
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF')) {
          const [, info = '', name = ''] = line.split(/,(.+)/);
          const durationRaw = info.split(' ')[0]?.replace('#EXTINF:', '');
          const duration = Number(durationRaw);
          currentChannel = {
            channelId: getAttribute(line, 'tvg-id'),
            channelName: getAttribute(line, 'tvg-name') || name.trim() || undefined,
            logo: getAttribute(line, 'tvg-logo'),
            groupTitle: getAttribute(line, 'group-title'),
            duration: Number.isFinite(duration) ? duration : undefined,
          };
          continue;
        }

        if (line.startsWith('#')) {
          continue;
        }

        currentChannel.url = line;
        channels.push(currentChannel as PlaylistChannel);
        currentChannel = {};
      }

      if (currentChannel.url) {
        channels.push(currentChannel as PlaylistChannel);
      }

      setParsedChannels(channels);
      setSelectedChannels([]);
      toast.success(`تم تحميل ${channels.length} قناة`);
    } catch (error) {
      console.error('Error parsing playlist:', error);
      toast.error('فشل في قراءة ملف القنوات');
    } finally {
      setLoadingChannels(false);
    }
  };

  const toggleChannelSelection = (channel: PlaylistChannel) => {
    setSelectedChannels(prev => {
      const isSelected = prev.some(c => c.url === channel.url);
      if (isSelected) {
        return prev.filter(c => c.url !== channel.url);
      } else {
        return [...prev, channel];
      }
    });
  };

  const toggleAllChannels = () => {
    if (selectedChannels.length === parsedChannels.length) {
      // Deselect all
      setSelectedChannels([]);
    } else {
      // Select all
      setSelectedChannels([...parsedChannels]);
    }
  };

  // Server management functions
  const addServerUrl = () => {
    setStreamForm({
      ...streamForm,
      serverUrls: [...streamForm.serverUrls, ''],
    });
  };

  const removeServerUrl = (index: number) => {
    setStreamForm({
      ...streamForm,
      serverUrls: streamForm.serverUrls.filter((_, i) => i !== index),
    });
  };

  const updateServerUrl = (index: number, value: string) => {
    const newServerUrls = [...streamForm.serverUrls];
    newServerUrls[index] = value;
    setStreamForm({
      ...streamForm,
      serverUrls: newServerUrls,
    });
  };

  const addSelectedChannels = async () => {
    if (selectedChannels.length === 0) {
      toast.error('الرجا تحديد قناة واحدة على الأقل');
      return;
    }
    if (!editingStream) {
      toast.error('يجب إنشاء البث أولاً قبل إضافة القنوات');
      return;
    }

    try {
      // Add selected channels as servers
      const serverPromises = selectedChannels.map(async (channel, index) => {
        const response = await fetch('/api/servers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: editingStream.id,
            name: channel.channelName || `القناة ${index + 1}`,
            url: channel.url,
            priority: index,
            channelId: channel.channelId,
            channelName: channel.channelName,
            channelLogo: channel.logo,
          }),
        });

        if (!response.ok) throw new Error('فشل في إضافة القناة');
        return response.json();
      });

      await Promise.all(serverPromises);

      toast.success(`تم إضافة ${selectedChannels.length} قناة إلى البث`);
      setSelectedChannels([]);
      setStreamFormOpen(false); // Close the form

      // Refresh streams to get updated server data
      await fetchData();
    } catch (error) {
      console.error('Error adding channels:', error);
      toast.error('فشل في إضافة القنوات');
    }
  };

  // Server operations
  const handleCreateServer = async () => {
    try {
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serverForm),
      });
      if (!response.ok) throw new Error('Failed to create server');
      toast.success('تم إضافة الخادم بنجاح');
      setServerFormOpen(false);
      resetServerForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في إضافة الخادم');
    }
  };

  const handleUpdateServer = async () => {
    if (!editingServer) return;
    try {
      const response = await fetch('/api/servers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingServer.id, ...serverForm }),
      });
      if (!response.ok) throw new Error('Failed to update server');
      toast.success('تم تحديث الخادم بنجاح');
      setServerFormOpen(false);
      setEditingServer(null);
      resetServerForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في تحديث الخادم');
    }
  };

  const handleDeleteServer = async (id: string) => {
    try {
      await fetch(`/api/servers?id=${id}`, { method: 'DELETE' });
      toast.success('تم حذف الخادم بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل في حذف الخادم');
    }
  };

  const openServerForm = (streamId: string, server?: Server) => {
    if (server) {
      setEditingServer(server);
      setServerForm({
        streamId: streamId,
        name: server.name,
        url: server.url,
        priority: server.priority,
      });
    } else {
      setEditingServer(null);
      setServerForm({
        streamId,
        name: '',
        url: '',
        priority: 0,
      });
    }
    setServerFormOpen(true);
  };

  const resetServerForm = () => {
    setServerForm({
      streamId: '',
      name: '',
      url: '',
      priority: 0,
    });
  };

  const openUserForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        email: user.email,
        name: user.name || '',
        password: '',
        role: user.role,
        theme: user.theme ?? 'light',
      });
    }
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      name: '',
      password: '',
      role: 'user',
      theme: 'light',
    });
  };

  // Ad operations
  const handleCreateAd = async () => {
    if (!adForm.imageUrl.trim() && adForm.position !== 'popunder-legal') {
      toast.error('أدخل رابط الصورة للإعلان');
      return;
    }
    if (adForm.position === 'popunder-legal' && !adForm.linkUrl.trim()) {
      toast.error('أدخل رابط الإعلان لإعلان Popunder');
      return;
    }
    try {
      const payload = {
        ...adForm,
        streamId: adForm.position.startsWith('stream-') ? null : adForm.streamId || null,
      };
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل إنشاء الإعلان');
      }
      setAds((prev) => [data, ...prev]);
      toast.success('تم إضافة الإعلان بنجاح');
      setAdFormOpen(false);
      resetAdForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل إضافة الإعلان');
    }
  };

  const handleUpdateAd = async () => {
    if (!editingAd) return;
    if (!adForm.imageUrl.trim() && adForm.position !== 'popunder-legal') {
      toast.error('أدخل رابط الصورة للإعلان');
      return;
    }
    if (adForm.position === 'popunder-legal' && !adForm.linkUrl.trim()) {
      toast.error('أدخل رابط الإعلان لإعلان Popunder');
      return;
    }
    try {
      const payload = {
        id: editingAd.id,
        ...adForm,
        streamId: adForm.position.startsWith('stream-') ? null : adForm.streamId || null,
      };
      const response = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل تحديث الإعلان');
      }
      setAds((prev) => prev.map((ad) => (ad.id === data.id ? data : ad)));
      toast.success('تم تحديث الإعلان بنجاح');
      setAdFormOpen(false);
      resetAdForm();
      setEditingAd(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل تحديث الإعلان');
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      const response = await fetch(`/api/ads?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل حذف الإعلان');
      }
      setAds((prev) => prev.filter((ad) => ad.id !== id));
      toast.success('تم حذف الإعلان');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل حذف الإعلان');
    }
  };

  const openAdForm = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setAdForm({
        streamId: ad.streamId ?? '',
        position: ad.position,
        title: ad.title ?? '',
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl ?? '',
        active: ad.active,
      });
    } else {
      setEditingAd(null);
      resetAdForm();
    }
    setAdFormOpen(true);
  };

  const resetAdForm = () => {
    setAdForm({
      streamId: '',
      position: 'home-top',
      title: '',
      imageUrl: '',
      linkUrl: '',
      active: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-slate-900/50 border-l border-slate-800 min-h-screen fixed right-0 top-0 transition-all duration-300 z-50`}
        >
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-red-700 p-2 rounded-lg">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                {sidebarOpen && (
                  <span className="text-white font-bold text-lg">لوحة التحكم</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-slate-800"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === 'streams' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'streams'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('streams')}
            >
              <Tv className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">البث المباشر</span>}
            </Button>

            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">المستخدمون</span>}
            </Button>

            <Button
              variant={activeTab === 'ads' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'ads'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('ads')}
            >
              <ImageIcon className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">الإعلانات</span>}
            </Button>

            <Button
              variant={activeTab === 'autoRefresh' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'autoRefresh'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('autoRefresh')}
            >
              <Timer className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">تحديث القوائم</span>}
            </Button>

            <Button
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">التحليلات</span>}
            </Button>

            <Button
              variant={activeTab === 'batch' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'batch'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('batch')}
            >
              <Rows className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">تحديث جماعي</span>}
            </Button>

            <Button
              variant={activeTab === 'duplicates' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'duplicates'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('duplicates')}
            >
              <CopyCheck className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">التكرارات</span>}
            </Button>

            <Button
              variant={activeTab === 'thumbnails' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'thumbnails'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('thumbnails')}
            >
              <ImagePlus className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">الصور المصغرة</span>}
            </Button>

            <Button
              variant={activeTab === 'quality' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'quality'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('quality')}
            >
              <Gauge className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">اختبار الجودة</span>}
            </Button>

            <Button
              variant={activeTab === 'categories' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('categories')}
            >
              <FolderTree className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">التصنيفات</span>}
            </Button>

            <Button
              variant={activeTab === 'backup' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'backup'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('backup')}
            >
              <Database className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">النسخ الاحتياطية</span>}
            </Button>

            <Button
              variant={activeTab === 'preview' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'preview'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              <MonitorPlay className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">معاينة البث</span>}
            </Button>

            <Button
              variant={activeTab === 'infrastructure' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'infrastructure'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('infrastructure')}
            >
              <ServerCog className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">البنية التحتية</span>}
            </Button>

            <Button
              variant={activeTab === 'abTesting' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'abTesting'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('abTesting')}
            >
              <BarChart3 className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">A/B للخوادم</span>}
            </Button>

            <Button
              variant={activeTab === 'featureFlags' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'featureFlags'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('featureFlags')}
            >
              <SlidersHorizontal className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">ميزات الموقع</span>}
            </Button>

            <Button
              variant={activeTab === 'siteSettings' ? 'default' : 'ghost'}
              className={`w-full justify-start ${
                activeTab === 'siteSettings'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab('siteSettings')}
            >
              <Settings className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">إعدادات الواجهة</span>}
            </Button>

            <Link
              href="/admin-portal-secure-2025-x7k9m2/bulk-publish"
              className="block"
            >
              <Button
                variant="ghost"
                className="w-full justify-start text-slate-300 hover:bg-slate-800"
              >
                <Upload className="h-5 w-5" />
                {sidebarOpen && <span className="mr-2">نشر القنوات</span>}
              </Button>
            </Link>
          </nav>

          <div className="absolute bottom-4 right-4 left-4">
            <Button
              variant="outline"
              className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span className="mr-2">تسجيل الخروج</span>}
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            sidebarOpen ? 'mr-64' : 'mr-20'
          }`}
        >
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {activeTab === 'streams' && 'إدارة البث المباشر'}
                {activeTab === 'users' && 'إدارة المستخدمين'}
                {activeTab === 'ads' && 'إدارة الإعلانات'}
                {activeTab === 'autoRefresh' && 'تحديث القوائم تلقائياً'}
                {activeTab === 'analytics' && 'لوحة التحليلات'}
                {activeTab === 'batch' && 'تحديثات جماعية'}
                {activeTab === 'duplicates' && 'الكشف عن التكرارات'}
                {activeTab === 'thumbnails' && 'مولد الصور المصغرة'}
                {activeTab === 'quality' && 'اختبار جودة البث'}
                {activeTab === 'categories' && 'مدير التصنيفات'}
                {activeTab === 'backup' && 'النسخ الاحتياطية'}
                {activeTab === 'preview' && 'معاينة البث'}
                {activeTab === 'infrastructure' && 'تشغيل البنية التحتية'}
                {activeTab === 'abTesting' && 'اختبار A/B للخوادم'}
                {activeTab === 'featureFlags' && 'إدارة ميزات الموقع'}
                {activeTab === 'siteSettings' && 'إعدادات الواجهة'}
              </h1>
              <p className="text-slate-400">
                إدارة وتحكم في جميع محتويات المنصة
              </p>
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="h-4 bg-slate-700 rounded animate-pulse" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-slate-700 rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Streams Tab */}
                {activeTab === 'streams' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <p className="text-slate-300">
                          عدد البثوص: {filteredStreams.length}
                          {streamSearchQuery.trim() && (
                            <span className="text-xs text-slate-500"> (الإجمالي {streams.length})</span>
                          )}
                        </p>
                      </div>
                      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                        <div className="min-w-[220px] flex-1 max-w-sm">
                          <Input
                            value={streamSearchQuery}
                            onChange={(event) => setStreamSearchQuery(event.target.value)}
                            placeholder="ابحث عن قناة..."
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                      <Button
                        onClick={checkAllStreamStatus}
                        disabled={streams.length === 0 || checkingStatus}
                        variant="outline"
                        className="border-slate-700 text-slate-300 flex items-center gap-2"
                      >
                        {checkingStatus ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>جاري الفحص...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>فحص الحالة</span>
                          </>
                        )}
                      </Button>
                      <Dialog open={streamFormOpen} onOpenChange={setStreamFormOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                            onClick={() => openStreamForm()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            إضافة بث جديد
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              {editingStream ? 'تعديل البث' : 'إضافة بث جديد'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                              أدخل بيانات البث المباشر
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">العنوان</Label>
                              <Input
                                value={streamForm.title}
                                onChange={(e) =>
                                  setStreamForm({ ...streamForm, title: e.target.value })
                                }
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description" className="text-slate-300 font-semibold">
                                وصف القناة
                              </Label>
                              <p className="text-xs text-slate-500">
                                اكف وصفاً مفصلاً للقناة لتحسين محركات البحث (SEO)
                              </p>
                              <Textarea
                                id="description"
                                value={streamForm.description}
                                onChange={(e) =>
                                  setStreamForm({ ...streamForm, description: e.target.value })
                                }
                                placeholder="اكتب وصفاً مفصلاً للقناة هنا... مثال: قناة إخبارية تبث الأخبار على مدار الساعة بجودة عالية"
                                className="bg-slate-800 border-slate-700 text-white min-h-[120px] resize-y"
                                maxLength={2000}
                              />
                              <div className="flex items-center justify-between text-xs">
                                <p className="text-slate-500">
                                  أضف كلمات مفتاحية مثل: أخبار، رياضة، ترفيه، بث مباشر
                                </p>
                                <p className="text-slate-400">
                                  {streamForm.description.length} / 2000
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">رابط الصورة المصغرة</Label>
                              <Input
                                value={streamForm.thumbnail}
                                onChange={(e) =>
                                  setStreamForm({ ...streamForm, thumbnail: e.target.value })
                                }
                                placeholder="https://..."
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>

                            {/* M3U Playlist URL Section */}
                            <div className="space-y-2 pt-4 border-t border-slate-700">
                              <Label htmlFor="playlist" className="text-slate-300 font-semibold">
                                رابط ملف القوائم M3U (اختياري)
                              </Label>
                              <p className="text-xs text-slate-500">
                                يمكنك إضافة ملف قائمة M3U واحد بدلاً من إضافة روابط فردية
                              </p>
                              <div className="flex gap-2">
                                <Input
                                  id="playlist"
                                  value={streamForm.playlistUrl}
                                  onChange={(e) =>
                                    setStreamForm({ ...streamForm, playlistUrl: e.target.value })
                                  }
                                  placeholder="https://example.com/playlist.m3u"
                                  className="bg-slate-800 border-slate-700 text-white flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleParsePlaylist}
                                  disabled={loadingChannels || !streamForm.playlistUrl}
                                  className="border-slate-700 text-slate-300 whitespace-nowrap"
                                >
                                  {loadingChannels ? (
                                    <>
                                      <div className="mr-2 h-4 w-4 border-2 border-slate-500 border-t-transparent animate-spin" />
                                      تحليل...
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-2a2 2 0 012-12V7a2 2 0 01-2-2-2-2z" />
                                      </svg>
                                      تحليل
                                    </>
                                  )}
                                </Button>
                              </div>
                              {parsedChannels.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                  <p className="text-sm text-blue-200 mb-2">
                                    <span className="font-semibold">تم العثور على {parsedChannels.length} قناة!</span>
                                    <span className="mx-2">|</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={toggleAllChannels}
                                      className="border-blue-400 text-blue-300 text-xs"
                                    >
                                      {selectedChannels.length === parsedChannels.length ? 'إلغاء تحديد الكل' : `تحديد الكل (${parsedChannels.length})`}
                                    </Button>
                                  </p>
                                  <Button
                                    type="button"
                                    onClick={addSelectedChannels}
                                    disabled={selectedChannels.length === 0}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    إضافة إلى البث ({selectedChannels.length})
                                  </Button>
                                </div>
                              )}

                              {/* Channel List */}
                              {parsedChannels.length > 0 && (
                                <div className="mt-3 max-h-60 overflow-y-auto border border-slate-700 rounded-lg bg-slate-900/50">
                                  {parsedChannels.slice(0, 50).map((channel, index) => (
                                    <div
                                      key={`${channel.url}-${index}`}
                                      className="flex items-center gap-3 p-2 hover:bg-slate-800/50 border-b border-slate-800 last:border-b-0 cursor-pointer"
                                      onClick={() => toggleChannelSelection(channel)}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedChannels.some(c => c.url === channel.url)}
                                        onChange={() => {}}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                                      />
                                      {channel.logo && (
                                        <img
                                          src={channel.logo}
                                          alt={channel.channelName || ''}
                                          className="w-8 h-8 object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">
                                          {channel.channelName || `قناة ${index + 1}`}
                                        </p>
                                        {channel.channelId && (
                                          <p className="text-xs text-slate-400">ID: {channel.channelId}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {parsedChannels.length > 50 && (
                                    <div className="p-3 text-center text-sm text-slate-400">
                                      وجدنا {parsedChannels.length} قناة، يتم عرض أول 50 قناة فقط
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Server URLs Section */}
                            <div className="space-y-4 pt-4 border-t border-slate-700">
                              <div className="flex items-center justify-between">
                                <Label className="text-slate-300 text-base font-semibold">
                                  روابط البث (M3U/M3U8)
                                </Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={addServerUrl}
                                  className="border-slate-600 text-slate-300"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  إضافة خادم
                                </Button>
                              </div>
                              <p className="text-xs text-slate-500">
                                أضف روابط البث المباشرة للخوادم المختلفة (يمكنك إضافة عدد غير محدود)
                              </p>

                              <div className="space-y-3 max-h-80 overflow-y-auto">
                                {streamForm.serverUrls.map((url, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <div className="flex-1 space-y-2">
                                      <Label htmlFor={`server-${index}`} className="text-slate-300">
                                        الخادم {index + 1}
                                      </Label>
                                      <Input
                                        id={`server-${index}`}
                                        value={url}
                                        onChange={(e) => updateServerUrl(index, e.target.value)}
                                        placeholder="https://example.com/stream.m3u8"
                                        className="bg-slate-800 border-slate-700 text-white"
                                      />
                                    </div>
                                    {streamForm.serverUrls.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeServerUrl(index)}
                                        className="mt-5 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Switch
                                id="published"
                                checked={streamForm.published}
                                onCheckedChange={(checked) =>
                                  setStreamForm({ ...streamForm, published: checked })
                                }
                              />
                              <Label htmlFor="published" className="text-slate-300">
                                نشر الآن
                              </Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setStreamFormOpen(false)}
                              className="border-slate-700 text-slate-300"
                            >
                              إلغاء
                            </Button>
                            <Button
                              onClick={editingStream ? handleUpdateStream : handleCreateStream}
                              className="bg-gradient-to-r from-red-600 to-red-700"
                            >
                              {editingStream ? 'حفظ التعديلات' : 'إضافة'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginatedStreams.map((stream) => (
                        <Card key={stream.id} className="bg-slate-800/50 border-slate-700 relative">
                          <CardHeader>
                            {/* Status Indicator */}
                            <div className="absolute top-4 right-4 z-10">
                              {streamStatus.get(stream.id) === 'working' ? (
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" title="متاح">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1"></div>
                                </div>
                              ) : streamStatus.get(stream.id) === 'broken' ? (
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" title="غير متاح">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1"></div>
                                </div>
                              ) : null}
                            </div>

                            {/* Quality Badge */}
                            {(() => {
                              const quality = getStreamQuality(getPrimaryServerUrl(stream), stream.title, stream.description);
                              const qualityInfo = formatQualityInfo(quality);
                              return quality.level !== 'Unknown' ? (
                                <div
                                  className={`absolute top-4 right-4 z-10 flex items-center gap-2 ${qualityInfo.className}`}
                                  title={quality.label}
                                >
                                  <span className="text-xs">{qualityInfo.icon}</span>
                                  <span>{qualityInfo.label}</span>
                                </div>
                              ) : null;
                            })()}

                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-white text-lg">
                                  {stream.title}
                                </CardTitle>
                                <CardDescription className="text-slate-400 mt-2">
                                  {stream.description || 'لا يوجد وصف'}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`text-slate-400 hover:text-white ${
                                    pinnedStreams.has(stream.id) ? 'text-yellow-400' : ''
                                  }`}
                                  onClick={() => togglePinStream(stream.id)}
                                  title={pinnedStreams.has(stream.id) ? 'إلغاء التثبيت' : 'تثبيت القناة'}
                                >
                                  <Pin className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-slate-400 hover:text-white"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-slate-900 border-slate-700">
                                    <DropdownMenuItem
                                      onClick={() => openStreamForm(stream)}
                                      className="text-slate-300 hover:bg-slate-800"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      تعديل
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteStream(stream.id)}
                                      className="text-red-400 hover:bg-slate-800"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      حذف
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {pinnedStreams.has(stream.id) && (
                              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-300">
                                <Pin className="h-3 w-3" />
                                مثبتة
                              </div>
                            )}
                            {stream.thumbnail && (
                              <img
                                src={stream.thumbnail}
                                alt={stream.title}
                                className="w-full h-32 object-cover rounded-lg mb-4"
                              />
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">
                                {stream.servers.length} خادم
                              </span>
                              <span
                                className={`px-2 py-1 rounded ${
                                  stream.published
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}
                              >
                                {stream.published ? 'منشور' : 'مسودة'}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-4 border-slate-700 text-slate-300"
                              onClick={() => openServerForm(stream.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              إضافة خادم
                            </Button>
                            <div className="mt-4 space-y-2">
                              {stream.servers.map((server) => (
                                <div
                                  key={server.id}
                                  className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="text-white text-sm font-medium">
                                      {server.name}
                                    </p>
                                    <p className="text-slate-500 text-xs truncate">
                                      {server.url}
                                    </p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-white"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-900 border-slate-700">
                                      <DropdownMenuItem
                                        onClick={() => openServerForm(stream.id, server)}
                                        className="text-slate-300 hover:bg-slate-800"
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        تعديل
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteServer(server.id)}
                                        className="text-red-400 hover:bg-slate-800"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                      <span>
                        عرض {paginatedStreams.length} من {sortedStreams.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                          disabled={streamsPage <= 1}
                          onClick={() => setStreamsPage((prev) => Math.max(1, prev - 1))}
                        >
                          السابق
                        </Button>
                        <span className="text-xs">
                          صفحة {streamsPage} من {totalStreamPages}
                        </span>
                        <Button
                          variant="outline"
                          className="border-slate-700 text-slate-300"
                          disabled={streamsPage >= totalStreamPages}
                          onClick={() => setStreamsPage((prev) => Math.min(totalStreamPages, prev + 1))}
                        >
                          التالي
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'autoRefresh' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="flex flex-col gap-2 border-b border-slate-700">
                        <CardTitle className="text-white">جدولة تحديث القوائم</CardTitle>
                        <CardDescription className="text-slate-400">
                          اضبط مواعيد التحديث التلقائي، راقب التغييرات، وفعّل تنبيهات البريد عند الفشل.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">اسم القائمة</Label>
                            <Input
                              value={refreshForm.name}
                              onChange={(e) => setRefreshForm({ ...refreshForm, name: e.target.value })}
                              placeholder="قائمة الأخبار"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">رابط قائمة M3U</Label>
                            <Input
                              value={refreshForm.url}
                              onChange={(e) => setRefreshForm({ ...refreshForm, url: e.target.value })}
                              placeholder="https://example.com/playlist.m3u"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">الفاصل الزمني</Label>
                            <select
                              value={refreshForm.interval}
                              onChange={(e) =>
                                setRefreshForm({
                                  ...refreshForm,
                                  interval: e.target.value as RefreshInterval,
                                })
                              }
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2"
                            >
                              <option value="hourly">كل ساعة</option>
                              <option value="daily">يومي</option>
                              <option value="weekly">أسبوعي</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">بريد التنبيه عند الفشل</Label>
                            <Input
                              value={refreshForm.notifyEmail}
                              onChange={(e) =>
                                setRefreshForm({ ...refreshForm, notifyEmail: e.target.value })
                              }
                              placeholder="dilerbarakad@gmail.com"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          {editingRefresh && (
                            <Button
                              variant="outline"
                              className="border-slate-700 text-slate-300"
                              onClick={() => {
                                setEditingRefresh(null);
                                setRefreshForm({
                                  name: '',
                                  url: '',
                                  interval: 'daily',
                                  notifyEmail: '',
                                });
                              }}
                            >
                              إلغاء التعديل
                            </Button>
                          )}
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700"
                            onClick={handleSaveRefreshConfig}
                          >
                            {editingRefresh ? 'تحديث الجدول' : 'إضافة جدول'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {refreshConfigs.length === 0 ? (
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-8 text-center text-slate-400">
                          لا توجد جداول تحديث حتى الآن. أضف أول جدول لتفعيل التحديث التلقائي.
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {refreshConfigs.map((config) => (
                          <Card key={config.id} className="bg-slate-800/50 border-slate-700">
                            <CardHeader className="flex flex-col gap-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-white text-lg">{config.name}</CardTitle>
                                  <CardDescription className="text-slate-400 break-all mt-1">
                                    {config.url}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-slate-700 text-slate-300"
                                    onClick={() => handleEditRefreshConfig(config)}
                                  >
                                    تعديل
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => handleDeleteRefreshConfig(config.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
                                <div>
                                  <p className="text-slate-500">الفاصل الزمني</p>
                                  <p>{intervalLabel(config.interval)}</p>
                                </div>
                                <div>
                                  <p className="text-slate-500">آخر تحديث</p>
                                  <p>
                                    {config.lastRefreshedAt
                                      ? new Date(config.lastRefreshedAt).toLocaleString('ar')
                                      : 'لم يتم بعد'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">التحديث القادم</p>
                                  <p>
                                    {config.nextRefreshAt
                                      ? new Date(config.nextRefreshAt).toLocaleString('ar')
                                      : 'غير مجدول'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-500">عدد القنوات</p>
                                  <p>{config.lastChannelCount ?? '—'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    config.lastStatus === 'success'
                                      ? 'bg-green-500/20 text-green-300'
                                      : config.lastStatus === 'failed'
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {config.lastStatus === 'success'
                                    ? 'تم التحديث'
                                    : config.lastStatus === 'failed'
                                    ? 'فشل التحديث'
                                    : 'لم يتم التحديث'}
                                </span>
                                {config.notifyEmail && (
                                  <span className="text-xs text-slate-400">
                                    تنبيه إلى: {config.notifyEmail}
                                  </span>
                                )}
                              </div>

                              {config.lastError && (
                                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                                  {config.lastError}
                                </div>
                              )}

                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-slate-700 text-slate-300"
                                  onClick={() => refreshPlaylist(config)}
                                  disabled={refreshingIds.has(config.id)}
                                >
                                  {refreshingIds.has(config.id) ? (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                      جاري التحديث...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      تحديث الآن
                                    </>
                                  )}
                                </Button>
                              </div>

                              <div className="border-t border-slate-700 pt-4 space-y-3">
                                <p className="text-sm text-slate-400">سجل التحديثات الأخيرة</p>
                                {config.history.length === 0 ? (
                                  <p className="text-xs text-slate-500">لا يوجد سجل بعد.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {config.history.slice(0, 5).map((entry) => (
                                      <div
                                        key={entry.id}
                                        className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/50 rounded-lg p-2"
                                      >
                                        <div>
                                          <p>
                                            {new Date(entry.timestamp).toLocaleString('ar')} -{' '}
                                            {entry.status === 'success' ? 'نجاح' : 'فشل'}
                                          </p>
                                          <p className="text-slate-500">{entry.message}</p>
                                        </div>
                                        <div className="text-right text-slate-400">
                                          <p>القنوات: {entry.totalChannels}</p>
                                          <p>
                                            +{entry.addedChannels} / -{entry.removedChannels}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-slate-300">
                        نظرة عامة على الأداء {analyticsRange === '24h' ? 'خلال 24 ساعة' : analyticsRange === '7d' ? 'خلال 7 أيام' : 'خلال 30 يومًا'}
                      </p>
                      <div className="flex items-center gap-2">
                        {(['24h', '7d', '30d'] as const).map((range) => (
                          <Button
                            key={range}
                            variant={analyticsRange === range ? 'default' : 'outline'}
                            size="sm"
                            className={`${
                              analyticsRange === range
                                ? 'bg-red-600 text-white'
                                : 'border-slate-700 text-slate-300'
                            }`}
                            onClick={() => setAnalyticsRange(range)}
                          >
                            {range === '24h' ? '24 ساعة' : range === '7d' ? '7 أيام' : '30 يومًا'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {analyticsCards.map((card) => (
                        <Card key={card.label} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-5 space-y-2">
                            <p className="text-sm text-slate-400">{card.label}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-2xl font-semibold text-white">{card.value}</p>
                              <span className="text-xs text-green-400">{card.delta}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">أكثر القنوات مشاهدة</CardTitle>
                          <CardDescription className="text-slate-400">
                            ترتيب القنوات حسب المشاهدات.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-900/50 text-slate-300">
                              <tr>
                                <th className="px-4 py-3 text-right">القناة</th>
                                <th className="px-4 py-3 text-right">المشاهدات</th>
                                <th className="px-4 py-3 text-right">التغير</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                              {topChannels.map((channel) => (
                                <tr key={channel.name} className="text-slate-200">
                                  <td className="px-4 py-3">{channel.name}</td>
                                  <td className="px-4 py-3">{channel.views.toLocaleString('ar')}</td>
                                  <td className="px-4 py-3 text-green-400">{channel.change}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">سجل النشاط</CardTitle>
                          <CardDescription className="text-slate-400">
                            آخر الأنشطة الإدارية.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          {activityLogs.map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center justify-between rounded-lg bg-slate-900/40 p-3 text-sm text-slate-200"
                            >
                              <div>
                                <p className="font-medium">{log.action}</p>
                                <p className="text-xs text-slate-400">{log.user}</p>
                              </div>
                              <span className="text-xs text-slate-400">{log.time}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">خريطة التوزيع الجغرافي</CardTitle>
                          <CardDescription className="text-slate-400">
                            توزيع المشاهدات حسب المناطق (تجريبي).
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-6 gap-2">
                            {Array.from({ length: 24 }).map((_, index) => (
                              <div
                                key={`heat-${index}`}
                                className={`h-10 rounded-md ${
                                  index % 5 === 0
                                    ? 'bg-red-500/70'
                                    : index % 3 === 0
                                    ? 'bg-red-500/40'
                                    : 'bg-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-3">
                            كل مربع يمثل كثافة مشاهدات منطقة محددة.
                          </p>
                        </CardContent>
                      </Card>

                      <div className="space-y-6">
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader className="border-b border-slate-700">
                            <CardTitle className="text-white">إحصاءات السيرفر</CardTitle>
                            <CardDescription className="text-slate-400">
                              نسبة التشغيل والمشكلات.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-900/50 text-slate-300">
                                <tr>
                                  <th className="px-4 py-3 text-right">السيرفر</th>
                                  <th className="px-4 py-3 text-right">الجاهزية</th>
                                  <th className="px-4 py-3 text-right">الحوادث</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700">
                                {uptimeStats.map((stat) => (
                                  <tr key={stat.server} className="text-slate-200">
                                    <td className="px-4 py-3">{stat.server}</td>
                                    <td className="px-4 py-3 text-green-400">{stat.uptime}</td>
                                    <td className="px-4 py-3">{stat.incidents}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader className="border-b border-slate-700">
                            <CardTitle className="text-white">أوقات الذروة</CardTitle>
                            <CardDescription className="text-slate-400">
                              توزيع الاستخدام خلال اليوم.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            {peakUsage.map((item) => (
                              <div key={item.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-slate-300">
                                  <span>{item.label}</span>
                                  <span>{item.value}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-700">
                                  <div
                                    className="h-2 rounded-full bg-red-500"
                                    style={{ width: item.value }}
                                  />
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'batch' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">تحديث روابط القنوات دفعة واحدة</CardTitle>
                        <CardDescription className="text-slate-400">
                          أدخل بيانات التحديث بصيغة CSV: <span className="text-slate-200">serverId,url</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-sm text-slate-300">
                            استيراد ملف CSV
                            <input
                              type="file"
                              accept=".csv,text/csv"
                              onChange={handleImportBatchFile}
                              className="mt-2 block text-xs text-slate-400"
                            />
                          </label>
                        </div>
                        <Textarea
                          value={batchUrlText}
                          onChange={(e) => setBatchUrlText(e.target.value)}
                          placeholder="serverId-1,https://example.com/stream1.m3u8"
                          className="bg-slate-800 border-slate-700 text-white min-h-[160px]"
                        />
                        <div className="flex items-center justify-end">
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700"
                            onClick={handleBatchUrlUpdate}
                            disabled={batchProcessing}
                          >
                            تحديث الروابط
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">حذف قنوات دفعة واحدة</CardTitle>
                          <CardDescription className="text-slate-400">
                            أدخل معرفات القنوات مفصولة بفواصل.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <Textarea
                            value={batchDeleteIds}
                            onChange={(e) => setBatchDeleteIds(e.target.value)}
                            placeholder="stream-id-1, stream-id-2"
                            className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                          />
                          <div className="flex items-center justify-end">
                            <Button
                              variant="destructive"
                              onClick={handleBatchDeleteStreams}
                              disabled={batchProcessing}
                            >
                              حذف القنوات
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">تعديل بيانات القنوات</CardTitle>
                          <CardDescription className="text-slate-400">
                            حدد القنوات وأدخل الفئة أو الوصف لتطبيق التغيير.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <Textarea
                            value={batchMetaIds}
                            onChange={(e) => setBatchMetaIds(e.target.value)}
                            placeholder="stream-id-1, stream-id-2"
                            className="bg-slate-800 border-slate-700 text-white min-h-[90px]"
                          />
                          <div className="space-y-2">
                            <Label className="text-slate-300">الفئة</Label>
                            <Input
                              value={batchCategory}
                              onChange={(e) => setBatchCategory(e.target.value)}
                              placeholder="sports"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">الوصف</Label>
                            <Textarea
                              value={batchDescription}
                              onChange={(e) => setBatchDescription(e.target.value)}
                              placeholder="وصف جديد للقناة"
                              className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                            />
                          </div>
                          <div className="flex items-center justify-end">
                            <Button
                              className="bg-gradient-to-r from-red-600 to-red-700"
                              onClick={handleBatchMetadataUpdate}
                              disabled={batchProcessing}
                            >
                              تحديث البيانات
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'duplicates' && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-400">إدارة التكرارات بضغطة واحدة.</p>
                      <Button
                        onClick={handleMergeAllDuplicates}
                        disabled={duplicateProcessing || duplicateStreamGroups.length === 0}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                      >
                        دمج كل التكرارات
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">تكرار القنوات</CardTitle>
                          <CardDescription className="text-slate-400">
                            القنوات التي تحمل نفس الاسم بعد التطبيع.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {duplicateStreamGroups.length === 0 ? (
                            <p className="text-sm text-slate-400">لا توجد قنوات مكررة.</p>
                          ) : (
                            duplicateStreamGroups.map((group, index) => {
                              const primaryId = mergePrimaryId || group[0].id;
                              const duplicateIds = group
                                .map((stream) => stream.id)
                                .filter((id) => id !== primaryId);
                              return (
                                <div
                                  key={`${group[0].id}-${index}`}
                                  className="rounded-lg border border-slate-700 p-4 space-y-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-200">
                                      {group[0].title} ({group.length} نسخة)
                                    </p>
                                    <Button
                                      size="sm"
                                      className="bg-gradient-to-r from-red-600 to-red-700"
                                      onClick={() => handleMergeDuplicates(primaryId, duplicateIds)}
                                      disabled={duplicateProcessing || duplicateIds.length === 0}
                                    >
                                      دمج التكرارات
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 text-xs">اختيار القناة الرئيسية</Label>
                                    <select
                                      value={primaryId}
                                      onChange={(e) => setMergePrimaryId(e.target.value)}
                                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2 text-sm"
                                    >
                                      {group.map((stream) => (
                                        <option key={stream.id} value={stream.id}>
                                          {stream.title} ({stream.id})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1 text-xs text-slate-400">
                                    {group.map((stream) => (
                                      <div key={stream.id} className="flex items-center justify-between">
                                        <span>{stream.id}</span>
                                        <span>{stream.servers.length} خادم</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">تكرار روابط الخوادم</CardTitle>
                          <CardDescription className="text-slate-400">
                            روابط البث المكررة عبر قنوات مختلفة.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                          {duplicateServerGroups.length === 0 ? (
                            <p className="text-sm text-slate-400">لا توجد روابط مكررة.</p>
                          ) : (
                            duplicateServerGroups.map(({ url, group }) => (
                              <div
                                key={url}
                                className="rounded-lg border border-slate-700 p-3 space-y-2"
                              >
                                <p className="text-xs text-slate-300 break-all">{url}</p>
                                <div className="space-y-1 text-xs text-slate-400">
                                  {group.map(({ stream, server }) => (
                                    <div key={server.id} className="flex items-center justify-between">
                                      <span>{stream.title}</span>
                                      <span>{server.id}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'thumbnails' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">مولد الصور المصغرة</CardTitle>
                        <CardDescription className="text-slate-400">
                          توليد صور مصغرة تلقائياً من روابط البث مع الاعتماد على شعارات القنوات كبديل.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700"
                            onClick={() => handleRegenerateThumbnails(false)}
                            disabled={thumbnailProcessing}
                          >
                            توليد للصور الفارغة
                          </Button>
                          <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                            onClick={() => handleRegenerateThumbnails(true)}
                            disabled={thumbnailProcessing}
                          >
                            إعادة توليد الجميع
                          </Button>
                        </div>

                        {thumbnailProcessing && (
                          <p className="text-sm text-slate-400">جاري تحديث الصور المصغرة...</p>
                        )}

                        {thumbnailSummary && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-300">
                            <div className="rounded-lg bg-slate-900/50 p-3">
                              <p className="text-slate-500">تم التحديث</p>
                              <p className="text-xl text-white">{thumbnailSummary.updated}</p>
                            </div>
                            <div className="rounded-lg bg-slate-900/50 p-3">
                              <p className="text-slate-500">تم التخطي</p>
                              <p className="text-xl text-white">{thumbnailSummary.skipped}</p>
                            </div>
                            <div className="rounded-lg bg-slate-900/50 p-3">
                              <p className="text-slate-500">فشل</p>
                              <p className="text-xl text-white">{thumbnailSummary.failed}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">معاينة القنوات</CardTitle>
                        <CardDescription className="text-slate-400">
                          عرض سريع لآخر 6 قنوات مع الصور المصغرة.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {streams.slice(0, 6).map((stream) => (
                            <div
                              key={stream.id}
                              className="rounded-xl border border-slate-700 bg-slate-900/40 overflow-hidden"
                            >
                              {stream.thumbnail ? (
                                <img
                                  src={stream.thumbnail}
                                  alt={stream.title}
                                  className="h-32 w-full object-cover"
                                />
                              ) : (
                                <div className="h-32 w-full flex items-center justify-center text-xs text-slate-400">
                                  لا توجد صورة
                                </div>
                              )}
                              <div className="p-3">
                                <p className="text-sm text-white line-clamp-1">{stream.title}</p>
                                <p className="text-xs text-slate-500">{stream.id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'quality' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">أداة اختبار الجودة</CardTitle>
                        <CardDescription className="text-slate-400">
                          اختبر دقة البث، معدل البت، زمن التأخير، ووقت التخزين المؤقت.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-slate-300">رابط البث</Label>
                          <Input
                            value={qualityUrl}
                            onChange={(e) => setQualityUrl(e.target.value)}
                            placeholder="https://example.com/stream.m3u8"
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                        <div className="flex items-center justify-end">
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700"
                            onClick={handleQualityTest}
                            disabled={qualityProcessing}
                          >
                            {qualityProcessing ? 'جاري الاختبار...' : 'بدء الاختبار'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {qualityReport && (
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">تقرير الجودة</CardTitle>
                          <CardDescription className="text-slate-400">
                            نتائج التحليل الأخيرة.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          {qualityReport.status === 'failed' ? (
                            <p className="text-sm text-red-400">{qualityReport.message}</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                              <div className="rounded-lg bg-slate-900/50 p-3">
                                <p className="text-slate-500">التصنيف</p>
                                <p className="text-xl text-white">{qualityReport.qualityLabel}</p>
                              </div>
                              <div className="rounded-lg bg-slate-900/50 p-3">
                                <p className="text-slate-500">الدقة</p>
                                <p className="text-xl text-white">{qualityReport.resolution}</p>
                              </div>
                              <div className="rounded-lg bg-slate-900/50 p-3">
                                <p className="text-slate-500">معدل البت</p>
                                <p className="text-xl text-white">
                                  {qualityReport.bitrateKbps} Kbps
                                </p>
                              </div>
                              <div className="rounded-lg bg-slate-900/50 p-3">
                                <p className="text-slate-500">زمن التأخير</p>
                                <p className="text-xl text-white">
                                  {qualityReport.latencyMs} ms
                                </p>
                              </div>
                              <div className="rounded-lg bg-slate-900/50 p-3">
                                <p className="text-slate-500">التخزين المؤقت</p>
                                <p className="text-xl text-white">
                                  {qualityReport.bufferMs} ms
                                </p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === 'categories' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">إدارة التصنيفات</CardTitle>
                        <CardDescription className="text-slate-400">
                          إنشاء تصنيفات جديدة وربطها بتسلسل هرمي.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">اسم التصنيف</Label>
                            <Input
                              value={categoryName}
                              onChange={(e) => setCategoryName(e.target.value)}
                              placeholder="Sports"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">التصنيف الأب</Label>
                            <select
                              value={categoryParentId}
                              onChange={(e) => setCategoryParentId(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2"
                            >
                              <option value="">بدون</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              className="bg-gradient-to-r from-red-600 to-red-700"
                              onClick={handleCreateCategory}
                            >
                              إضافة التصنيف
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">هيكل التصنيفات</CardTitle>
                          <CardDescription className="text-slate-400">
                            اسحب قناة إلى التصنيف لتغيير تصنيفها.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {categories.length === 0 ? (
                            <p className="text-sm text-slate-400">لا توجد تصنيفات بعد.</p>
                          ) : (
                            <div className="space-y-3">
                              {categories
                                .filter((category) => !category.parentId)
                                .map((parent) => (
                                  <div
                                    key={parent.id}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => handleCategoryDrop(event, parent.id)}
                                    className="rounded-lg border border-slate-700 p-3 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-200 font-medium">{parent.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400"
                                        onClick={() => handleDeleteCategory(parent.id)}
                                      >
                                        حذف
                                      </Button>
                                    </div>
                                    <div className="space-y-2 border-l border-slate-700 pl-4">
                                      {categories
                                        .filter((child) => child.parentId === parent.id)
                                        .map((child) => (
                                          <div
                                            key={child.id}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={(event) => handleCategoryDrop(event, child.id)}
                                            className="flex items-center justify-between rounded-md bg-slate-900/40 p-2"
                                          >
                                            <span className="text-sm text-slate-300">
                                              {child.name}
                                            </span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-400"
                                              onClick={() => handleDeleteCategory(child.id)}
                                            >
                                              حذف
                                            </Button>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                          <div
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleCategoryDrop(event)}
                            className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-400"
                          >
                            اسحب هنا لإزالة التصنيف
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">القنوات</CardTitle>
                          <CardDescription className="text-slate-400">
                            حدد قنوات لتطبيق تصنيف جماعي أو اسحب قناة لتغيير تصنيفها.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {categories.map((category) => (
                              <Button
                                key={category.id}
                                size="sm"
                                variant="outline"
                                className="border-slate-700 text-slate-300"
                                onClick={() => handleBulkAssignCategory(category.id)}
                                disabled={batchProcessing}
                              >
                                تطبيق {category.name}
                              </Button>
                            ))}
                          </div>
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {streams.map((stream) => (
                              <div
                                key={stream.id}
                                draggable
                                onDragStart={(event) =>
                                  event.dataTransfer.setData('text/plain', stream.id)
                                }
                                className={`flex items-center justify-between rounded-lg border border-slate-700 p-3 text-sm ${
                                  selectedStreamIds.has(stream.id)
                                    ? 'bg-red-500/10'
                                    : 'bg-slate-900/40'
                                }`}
                              >
                                <div>
                                  <p className="text-slate-200">{stream.title}</p>
                                  <p className="text-xs text-slate-500">{stream.id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">
                                    {stream.categoryId || 'بدون تصنيف'}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={selectedStreamIds.has(stream.id)}
                                    onChange={() => toggleStreamSelection(stream.id)}
                                    className="h-4 w-4 accent-red-500"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'backup' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">النسخ الاحتياطية والاستعادة</CardTitle>
                        <CardDescription className="text-slate-400">
                          قم بتصدير نسخة كاملة أو استعادة قاعدة البيانات من ملف JSON.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700"
                            onClick={() => handleExportBackup('json')}
                            disabled={backupProcessing}
                          >
                            تصدير JSON
                          </Button>
                          <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                            onClick={() => handleExportBackup('sql')}
                            disabled={backupProcessing}
                          >
                            تصدير SQL
                          </Button>
                          <label className="text-sm text-slate-300">
                            استيراد نسخة JSON
                            <input
                              type="file"
                              accept="application/json"
                              onChange={handleImportBackup}
                              className="mt-2 block text-xs text-slate-400"
                              disabled={backupProcessing}
                            />
                          </label>
                        </div>
                        <div className="text-sm text-slate-400">
                          آخر نسخة: {lastBackupAt ? new Date(lastBackupAt).toLocaleString('ar') : 'غير متاحة'}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">تصدير البيانات</CardTitle>
                          <CardDescription className="text-slate-400">
                            تصدير قائمة القنوات أو بيانات التحليلات.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                          <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300 w-full justify-center"
                            onClick={handleExportChannels}
                            disabled={backupProcessing}
                          >
                            تصدير القنوات (CSV)
                          </Button>
                          <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300 w-full justify-center"
                            onClick={handleExportAnalytics}
                            disabled={backupProcessing}
                          >
                            تصدير التحليلات (JSON)
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">جدولة النسخ الاحتياطي</CardTitle>
                          <CardDescription className="text-slate-400">
                            اختر جدول النسخ الاحتياطي التلقائي (محلياً).
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <select
                            value={backupSchedule}
                            onChange={(e) =>
                              setBackupSchedule(e.target.value as 'daily' | 'weekly' | 'monthly')
                            }
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2"
                          >
                            <option value="daily">يومي</option>
                            <option value="weekly">أسبوعي</option>
                            <option value="monthly">شهري</option>
                          </select>
                          <p className="text-xs text-slate-400">
                            سيتم تنفيذ الجدولة تلقائياً عند ربطها بخدمة السيرفر.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'preview' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">معاينة البث</CardTitle>
                        <CardDescription className="text-slate-400">
                          شغّل البث مباشرة داخل لوحة الإدارة وتحقق من معلومات البث.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="space-y-2 lg:col-span-2">
                            <Label className="text-slate-300">رابط البث</Label>
                            <Input
                              value={previewUrl}
                              onChange={(e) => setPreviewUrl(e.target.value)}
                              placeholder="https://example.com/stream.m3u8"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">اختيار قناة</Label>
                            <select
                              value={previewStreamId}
                              onChange={(e) => setPreviewStreamId(e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2"
                            >
                              <option value="">اختياري</option>
                              {streams.map((stream) => (
                                <option key={stream.id} value={stream.id}>
                                  {stream.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            className="border-slate-700 text-slate-300"
                            onClick={handlePreviewMetadata}
                          >
                            جلب معلومات البث
                          </Button>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                          <video
                            src={previewUrl || undefined}
                            controls
                            className="w-full rounded-lg bg-black"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {previewReport && (
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">معلومات البث</CardTitle>
                          <CardDescription className="text-slate-400">
                            بيانات تقنية من نقطة المعاينة.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                            <div className="rounded-lg bg-slate-900/50 p-3">
                              <p className="text-slate-500">Codec</p>
                              <p className="text-xl text-white">{previewReport.codec || '—'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-900/50 p-3">
                              <p className="text-slate-500">الدقة</p>
                              <p className="text-xl text-white">{previewReport.resolution || '—'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-900/50 p-3">
                              <p className="text-slate-500">معدل البت</p>
                              <p className="text-xl text-white">
                                {previewReport.bitrateKbps ? `${previewReport.bitrateKbps} Kbps` : '—'}
                              </p>
                            </div>
                            <div className="rounded-lg bg-slate-900/50 p-3">
                              <p className="text-slate-500">زمن التأخير</p>
                              <p className="text-xl text-white">
                                {previewReport.latencyMs ? `${previewReport.latencyMs} ms` : '—'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === 'infrastructure' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">حالة الخوادم</CardTitle>
                          <CardDescription className="text-slate-400">
                            مراقبة تشغيل الخوادم الأساسية.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {uptimeStats.map((stat) => (
                            <div key={stat.server} className="flex items-center justify-between text-sm">
                              <span className="text-slate-300">{stat.server}</span>
                              <span className="text-emerald-400">{stat.uptime}</span>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            className="w-full border-slate-700 text-slate-300"
                            onClick={checkAllStreamStatus}
                            disabled={checkingStatus}
                          >
                            {checkingStatus ? 'جاري التحقق...' : 'إعادة فحص القنوات'}
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">مؤشرات الأداء</CardTitle>
                          <CardDescription className="text-slate-400">
                            ملخص سريع لاستهلاك الموارد.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3 text-sm text-slate-300">
                          <div className="flex items-center justify-between">
                            <span>متوسط التحميل</span>
                            <span className="text-blue-300">{autoScalingConfig.targetLoad}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>الخوادم النشطة</span>
                            <span className="text-slate-200">{streams.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>تنبيهات اليوم</span>
                            <span className="text-yellow-300">3</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">تشغيل النسخ الاحتياطي</CardTitle>
                          <CardDescription className="text-slate-400">
                            إدارة دورات النسخ الاحتياطي المحلية.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3 text-sm text-slate-300">
                          <p>آخر نسخة: {lastBackupAt ? new Date(lastBackupAt).toLocaleString('ar') : 'غير متاحة'}</p>
                          <Button
                            className="w-full bg-gradient-to-r from-red-600 to-red-700"
                            onClick={() => handleExportBackup('json')}
                            disabled={backupProcessing}
                          >
                            إنشاء نسخة جديدة
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'abTesting' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">اختبارات A/B الجارية</CardTitle>
                        <CardDescription className="text-slate-400">
                          راقب توزيع الترافيك بين البدائل المختلفة.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        {abTests.map((test) => (
                          <div key={test.id} className="rounded-lg border border-slate-700 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-semibold">{test.name}</p>
                                <p className="text-xs text-slate-400">{test.description}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-700 text-slate-300"
                                onClick={() =>
                                  setAbTests((prev) =>
                                    prev.map((item) =>
                                      item.id === test.id
                                        ? {
                                            ...item,
                                            status: item.status === 'running' ? 'paused' : 'running',
                                          }
                                        : item
                                    )
                                  )
                                }
                              >
                                {test.status === 'running' ? 'إيقاف' : 'تشغيل'}
                              </Button>
                            </div>
                            <div className="space-y-2 text-sm text-slate-300">
                              {test.variants.map((variant) => (
                                <div key={variant.name} className="flex items-center justify-between">
                                  <span>{variant.name}</span>
                                  <span>{variant.ratio}%</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-slate-400">
                              الحالة الحالية: {test.status === 'running' ? 'قيد التشغيل' : 'متوقف'}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'featureFlags' && (
                  <div className="space-y-6">
                    {featureFlagSections.map((section) => (
                      <Card key={section.title} className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white">{section.title}</CardTitle>
                          <CardDescription className="text-slate-400">
                            {section.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          {section.flags.map((flag) => (
                            <div
                              key={flag.key}
                              className="flex items-center justify-between rounded-lg border border-slate-700 p-4"
                            >
                              <div>
                                <p className="text-white font-medium">{flag.name}</p>
                                <p className="text-xs text-slate-400">{flag.description}</p>
                              </div>
                              <Switch
                                checked={featureFlags[flag.key]}
                                onCheckedChange={(checked) =>
                                  setFeatureFlags((prev) => ({
                                    ...prev,
                                    [flag.key]: checked,
                                  }))
                                }
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">القنوات الموصى بها</CardTitle>
                        <CardDescription className="text-slate-400">
                          اختر ما إذا كانت التوصيات تلقائية أو يدوية، وسيتم عرض قناتين فقط أسفل البث.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-slate-300">طريقة الاختيار</Label>
                          <select
                            value={streamRecommendations.mode}
                            onChange={(event) =>
                              setStreamRecommendations((prev) => ({
                                ...prev,
                                mode: event.target.value as StreamRecommendationSettings['mode'],
                              }))
                            }
                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2"
                          >
                            <option value="auto">تلقائي</option>
                            <option value="manual">يدوي</option>
                          </select>
                        </div>

                        {streamRecommendations.mode === 'manual' && (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-400">
                              اختر قناتين كحد أقصى لعرضها في صفحة البث.
                            </p>
                            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-2">
                              {streams.length === 0 ? (
                                <p className="text-sm text-slate-500">لا توجد قنوات متاحة للاختيار.</p>
                              ) : (
                                streams.map((stream) => (
                                  <label
                                    key={stream.id}
                                    className="flex items-center gap-3 rounded-md border border-slate-800 p-2 hover:border-slate-600"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={streamRecommendations.manualIds.includes(stream.id)}
                                      onChange={() => toggleManualRecommendation(stream.id)}
                                      className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm text-white">{stream.title}</p>
                                      <p className="text-xs text-slate-500">{stream.id}</p>
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'siteSettings' && (
                  <div className="space-y-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="border-b border-slate-700">
                        <CardTitle className="text-white">إعدادات الواجهة</CardTitle>
                        <CardDescription className="text-slate-400">
                          إعدادات عامة تظهر في الواجهة الرئيسية.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-300">عنوان الموقع</Label>
                            <Input
                              value={siteSettings.siteTitle}
                              onChange={(e) => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">أيقونة الموقع (Favicon)</Label>
                            <Input
                              value={siteSettings.faviconUrl ?? ''}
                              onChange={(e) => setSiteSettings({ ...siteSettings, faviconUrl: e.target.value })}
                              placeholder="https://example.com/favicon.ico"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">البريد الداعم</Label>
                            <Input
                              value={siteSettings.supportEmail}
                              onChange={(e) => setSiteSettings({ ...siteSettings, supportEmail: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">أيقونة الصفحة</Label>
                            <Input
                              value={siteSettings.appIconUrl ?? ''}
                              onChange={(e) => setSiteSettings({ ...siteSettings, appIconUrl: e.target.value })}
                              placeholder="https://example.com/logo.png"
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2 lg:col-span-2">
                            <Label className="text-slate-300">رسالة الصفحة الرئيسية</Label>
                            <Textarea
                              value={siteSettings.heroMessage}
                              onChange={(e) => setSiteSettings({ ...siteSettings, heroMessage: e.target.value })}
                              className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">فاصل Popunder (بالثواني)</Label>
                            <Input
                              type="number"
                              min={10}
                              value={siteSettings.popunderIntervalSeconds ?? 120}
                              onChange={(e) =>
                                setSiteSettings({
                                  ...siteSettings,
                                  popunderIntervalSeconds: Number(e.target.value),
                                })
                              }
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">حد مرات Popunder</Label>
                            <Input
                              type="number"
                              min={1}
                              value={siteSettings.popunderMaxOpens ?? 3}
                              onChange={(e) =>
                                setSiteSettings({
                                  ...siteSettings,
                                  popunderMaxOpens: Number(e.target.value),
                                })
                              }
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-300">الثيم الافتراضي</Label>
                            <select
                              value={siteSettings.defaultTheme}
                              onChange={(e) =>
                                setSiteSettings({
                                  ...siteSettings,
                                  defaultTheme: e.target.value as SiteSettings['defaultTheme'],
                                })
                              }
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2"
                            >
                              <option value="dark">داكن</option>
                              <option value="light">فاتح</option>
                            </select>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          يتم حفظ الإعدادات محلياً على هذا المتصفح.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-300">عدد المستخدمين: {users.length}</p>
                      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                            onClick={() => openUserForm()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            إضافة مستخدم جديد
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                              أدخل بيانات المستخدم
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">البريد الإلكتروني</Label>
                              <Input
                                type="email"
                                value={userForm.email}
                                onChange={(e) =>
                                  setUserForm({ ...userForm, email: e.target.value })
                                }
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">الاسم</Label>
                              <Input
                                value={userForm.name}
                                onChange={(e) =>
                                  setUserForm({ ...userForm, name: e.target.value })
                                }
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">
                                {editingUser ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور'}
                              </Label>
                              <Input
                                type="password"
                                value={userForm.password}
                                onChange={(e) =>
                                  setUserForm({ ...userForm, password: e.target.value })
                                }
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">الدور</Label>
                              <select
                                value={userForm.role}
                                onChange={(e) =>
                                  setUserForm({ ...userForm, role: e.target.value })
                                }
                                className="w-full bg-slate-800 border-slate-700 text-white rounded-md p-2"
                              >
                                <option value="user">مستخدم</option>
                                <option value="admin">مسؤول</option>
                              </select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setUserFormOpen(false)}
                              className="border-slate-700 text-slate-300"
                            >
                              إلغاء
                            </Button>
                            <Button
                              onClick={editingUser ? handleUpdateUser : handleCreateUser}
                              className="bg-gradient-to-r from-red-600 to-red-700"
                            >
                              {editingUser ? 'حفظ التعديلات' : 'إضافة'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-slate-900/50">
                              <tr>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                                  الاسم
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                                  البريد الإلكتروني
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                                  الدور
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                                  الإجراءات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                              {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-900/30">
                                  <td className="px-6 py-4 text-sm text-white">
                                    {user.name || '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-300">
                                    {user.email}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        user.role === 'admin'
                                          ? 'bg-red-500/20 text-red-400'
                                          : 'bg-blue-500/20 text-blue-400'
                                      }`}
                                    >
                                      {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openUserForm(user)}
                                        className="text-slate-400 hover:text-white"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Ads Tab */}
                {activeTab === 'ads' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <p className="text-slate-300">عدد الإعلانات: {ads.length}</p>
                      <Dialog open={adFormOpen} onOpenChange={setAdFormOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                            onClick={() => openAdForm()}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            إضافة إعلان جديد
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-900 border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              {editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                              أدخل بيانات الإعلان
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">الموقع</Label>
                              <select
                                value={adForm.position}
                                onChange={(e) => {
                                  const nextPosition = e.target.value;
                                  setAdForm((prev) => ({
                                    ...prev,
                                    position: nextPosition,
                                    streamId: nextPosition.startsWith('stream-') ? '' : prev.streamId,
                                  }));
                                }}
                                className="w-full bg-slate-800 border-slate-700 text-white rounded-md p-2"
                              >
                                <option value="home-top">الصفحة الرئيسية - أعلى</option>
                                <option value="home-bottom">الصفحة الرئيسية - أسفل</option>
                                <option value="stream-top">صفحة البث - أعلى</option>
                                <option value="stream-bottom">صفحة البث - أسفل</option>
                                <option value="stream-sidebar">صفحة البث - جانبي</option>
                                <option value="popunder-legal">إعلان Popunder قانوني</option>
                              </select>
                            </div>
                            {adForm.position.startsWith('stream-') && (
                              <p className="text-xs text-slate-500">
                                سيتم تطبيق الإعلان على جميع القنوات في صفحة البث.
                              </p>
                            )}
                            <div className="space-y-2">
                              <Label className="text-slate-300">العنوان</Label>
                              <Input
                                value={adForm.title}
                                onChange={(e) =>
                                  setAdForm({ ...adForm, title: e.target.value })
                                }
                                placeholder="عنوان الإعلان (اختياري)"
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">رابط الصورة</Label>
                              <Input
                                value={adForm.imageUrl}
                                onChange={(e) =>
                                  setAdForm({ ...adForm, imageUrl: e.target.value })
                                }
                                placeholder="https://..."
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-slate-300">رابط الإعلان</Label>
                              <Input
                                value={adForm.linkUrl}
                                onChange={(e) =>
                                  setAdForm({ ...adForm, linkUrl: e.target.value })
                                }
                                placeholder="https://..."
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Switch
                                id="active"
                                checked={adForm.active}
                                onCheckedChange={(checked) =>
                                  setAdForm({ ...adForm, active: checked })
                                }
                              />
                              <Label htmlFor="active" className="text-slate-300">
                                نشط
                              </Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setAdFormOpen(false)}
                              className="border-slate-700 text-slate-300"
                            >
                              إلغاء
                            </Button>
                            <Button
                              onClick={editingAd ? handleUpdateAd : handleCreateAd}
                              className="bg-gradient-to-r from-red-600 to-red-700"
                            >
                              {editingAd ? 'حفظ التعديلات' : 'إضافة'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ads.map((ad) => (
                        <Card key={ad.id} className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-white text-lg">
                                  {ad.title || 'بدون عنوان'}
                                </CardTitle>
                                <CardDescription className="text-slate-400 mt-2">
                                  {ad.position}
                                </CardDescription>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-slate-400 hover:text-white"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-slate-900 border-slate-700">
                                  <DropdownMenuItem
                                    onClick={() => openAdForm(ad)}
                                    className="text-slate-300 hover:bg-slate-800"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    تعديل
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAd(ad.id)}
                                    className="text-red-400 hover:bg-slate-800"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    حذف
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {ad.imageUrl && (
                              <img
                                src={ad.imageUrl}
                                alt={ad.title || 'إعلان'}
                                className="w-full h-40 object-cover rounded-lg mb-4"
                              />
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">
                                {ad.linkUrl ? 'رابط متاح' : 'بدون رابط'}
                              </span>
                              <span
                                className={`px-2 py-1 rounded ${
                                  ad.active
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {ad.active ? 'نشط' : 'غير نشط'}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Server Form Dialog */}
      <Dialog open={serverFormOpen} onOpenChange={setServerFormOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingServer ? 'تعديل الخادم' : 'إضافة خادم جديد'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              أدخل بيانات خادم البث
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">اسم الخادم</Label>
              <Input
                value={serverForm.name}
                onChange={(e) =>
                  setServerForm({ ...serverForm, name: e.target.value })
                }
                placeholder="مثال: الخادم 1"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">رابط البث (M3U/M3U8)</Label>
              <Input
                value={serverForm.url}
                onChange={(e) =>
                  setServerForm({ ...serverForm, url: e.target.value })
                }
                placeholder="https://example.com/stream.m3u8"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">الأولوية</Label>
              <Input
                type="number"
                value={serverForm.priority}
                onChange={(e) =>
                  setServerForm({ ...serverForm, priority: parseInt(e.target.value) || 0 })
                }
                placeholder="0 = أعلى أولوية"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setServerFormOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              إلغاء
            </Button>
            <Button
              onClick={editingServer ? handleUpdateServer : handleCreateServer}
              className="bg-gradient-to-r from-red-600 to-red-700"
            >
              {editingServer ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
