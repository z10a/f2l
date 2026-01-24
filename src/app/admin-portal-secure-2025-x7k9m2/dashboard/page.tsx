'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Tv,
  Users,
  Image as ImageIcon,
  LogOut,
  Plus,
  Trash2,
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
  createdAt?: string;
  updatedAt?: string;
}

interface Ad {
  id: string;
  streamId: string | null;
  position: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
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

const WEBSITE_SETTINGS_KEY = 'websiteSettings';

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
      if (activeTab === 'streams') {
        const response = await fetch('/api/streams');
        const data = await response.json();
        setStreams(data);
      } else if (activeTab === 'users') {
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

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse EXTINF metadata
        if (line.startsWith('#EXTINF:')) {
          if (currentChannel.url) {
            channels.push({ ...currentChannel } as PlaylistChannel);
          }
          currentChannel = { url: '' };

          const extinfLine = line.substring(8); // Remove #EXTINF:
          // Split by comma - everything after the last comma is the channel name
          const lastCommaIndex = extinfLine.lastIndexOf(',');
          if (lastCommaIndex !== -1) {
            const metadataPart = extinfLine.substring(0, lastCommaIndex);
            const channelName = extinfLine.substring(lastCommaIndex + 1).trim();

            // Set channel name (remove quotes if present)
            currentChannel.channelName = channelName.replace(/^"|"$/g, '');

            // Parse metadata attributes
            const attributes = metadataPart.split(/\s+/);
            for (const attr of attributes) {
              if (attr.includes('=')) {
                const [key, value] = attr.split('=');
                const cleanKey = key.trim().toLowerCase();
                const cleanValue = value.replace(/^"|"$/g, '').trim();

                if (cleanKey === 'tvg-id') {
                  currentChannel.channelId = cleanValue;
                } else if (cleanKey === 'tvg-logo') {
                  currentChannel.logo = cleanValue;
                } else if (cleanKey === 'tvg-name') {
                  if (!currentChannel.channelName) {
                    currentChannel.channelName = cleanValue;
                  }
                } else if (cleanKey === 'group-title') {
                  currentChannel.groupTitle = cleanValue;
                }
              }
            }
          }
        }

        // Parse stream URL
        if (!line.startsWith('#') && line.trim()) {
          currentChannel.url = line.trim();
        }
      }

      // Add last channel
      if (currentChannel.url) {
        channels.push({ ...currentChannel } as PlaylistChannel);
      }
      toast.success('تم تحديث التصنيف');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل تحديث التصنيف');
    }
  };

      setParsedChannels(channels);
      toast.success(`تم تحليل ${channels.length} قناة من القائمة`);
      setLoadingChannels(false);
    } catch (error) {
      console.error('Error parsing playlist:', error);
      toast.error('فشل في تحليل ملف القائمة');
      setLoadingChannels(false);
    }
    setSelectedStreamIds(new Set());
    setBatchProcessing(false);
    await fetchData();
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

  const handleExportAnalytics = async () => {
    setBackupProcessing(true);
    try {
      const response = await fetch('/api/admin/analytics/export');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'فشل تصدير التحليلات');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'analytics.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('تم تنزيل بيانات التحليلات');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل تصدير التحليلات');
    } finally {
      setBackupProcessing(false);
    }
  };

  // User operations
  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      if (!response.ok) throw new Error('Failed to create user');
      toast.success('تم إنشاء المستخدم بنجاح');
      setUserFormOpen(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في إنشاء المستخدم');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, ...userForm }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      toast.success('تم تحديث المستخدم بنجاح');
      setUserFormOpen(false);
      setEditingUser(null);
      resetUserForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في تحديث المستخدم');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      toast.success('تم حذف المستخدم بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل في حذف المستخدم');
    }
  };

  const openUserForm = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        email: user.email,
        name: user.name || '',
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      resetUserForm();
    }
    setUserFormOpen(true);
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      name: '',
      password: '',
      role: 'user',
    });
  };

  // Ad operations
  const handleCreateAd = async () => {
    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adForm),
      });
      if (!response.ok) throw new Error('Failed to create ad');
      toast.success('تم إنشاء الإعلان بنجاح');
      setAdFormOpen(false);
      resetAdForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في إنشاء الإعلان');
    }
  };

  const handleUpdateAd = async () => {
    if (!editingAd) return;
    try {
      const response = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingAd.id, ...adForm }),
      });
      if (!response.ok) throw new Error('Failed to update ad');
      toast.success('تم تحديث الإعلان بنجاح');
      setAdFormOpen(false);
      setEditingAd(null);
      resetAdForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في تحديث الإعلان');
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await fetch(`/api/ads?id=${id}`, { method: 'DELETE' });
      toast.success('تم حذف الإعلان بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل في حذف الإعلان');
    }
  };

  const openAdForm = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setAdForm({
        streamId: '',
        position: ad.position,
        title: ad.title || '',
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl || '',
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

  const handleDeleteRefreshConfig = (configId: string) => {
    setRefreshConfigs((prev) => prev.filter((config) => config.id !== configId));
    toast.success('تم حذف جدول التحديث');
  };

  // Check all stream statuses
  const checkAllStreamStatus = async () => {
    if (streams.length === 0) {
      toast.error('لا يوجد قنوات للفحص');
      return;
    }

    setCheckingStatus(true);
    setStreamStatus(new Map());

    try {
      const streamIds = streams.map(s => s.id);
      const response = await fetch('/api/channels/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Status check failed');
      }

      // Convert results to Map
      const statusMap = new Map<string, 'working' | 'broken'>();
      data.results.forEach((result: any) => {
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

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    window.location.href = '/admin-portal-secure-2025-x7k9m2';
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

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse EXTINF metadata
        if (line.startsWith('#EXTINF:')) {
          if (currentChannel.url) {
            channels.push({ ...currentChannel } as PlaylistChannel);
          }
          currentChannel = { url: '' };

          const extinfLine = line.substring(8); // Remove #EXTINF:
          // Split by comma - everything after the last comma is the channel name
          const lastCommaIndex = extinfLine.lastIndexOf(',');
          if (lastCommaIndex !== -1) {
            const metadataPart = extinfLine.substring(0, lastCommaIndex);
            const channelName = extinfLine.substring(lastCommaIndex + 1).trim();

            // Set channel name (remove quotes if present)
            currentChannel.channelName = channelName.replace(/^"|"$/g, '');

            // Parse metadata attributes
            const attributes = metadataPart.split(/\s+/);
            for (const attr of attributes) {
              if (attr.includes('=')) {
                const [key, value] = attr.split('=');
                const cleanKey = key.trim().toLowerCase();
                const cleanValue = value.replace(/^"|"$/g, '').trim();

                if (cleanKey === 'tvg-id') {
                  currentChannel.channelId = cleanValue;
                } else if (cleanKey === 'tvg-logo') {
                  currentChannel.logo = cleanValue;
                } else if (cleanKey === 'tvg-name') {
                  if (!currentChannel.channelName) {
                    currentChannel.channelName = cleanValue;
                  }
                } else if (cleanKey === 'group-title') {
                  currentChannel.groupTitle = cleanValue;
                }
              }
            }
          }
        }

        // Parse stream URL
        if (!line.startsWith('#') && line.trim()) {
          currentChannel.url = line.trim();
        }
      }

      // Add last channel
      if (currentChannel.url) {
        channels.push({ ...currentChannel } as PlaylistChannel);
      }

      setParsedChannels(channels);
      toast.success(`تم تحليل ${channels.length} قناة من القائمة`);
      setLoadingChannels(false);
    } catch (error) {
      console.error('Error parsing playlist:', error);
      toast.error('فشل في تحليل ملف القائمة');
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

  // User operations
  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      if (!response.ok) throw new Error('Failed to create user');
      toast.success('تم إنشاء المستخدم بنجاح');
      setUserFormOpen(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في إنشاء المستخدم');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, ...userForm }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      toast.success('تم تحديث المستخدم بنجاح');
      setUserFormOpen(false);
      setEditingUser(null);
      resetUserForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في تحديث المستخدم');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      toast.success('تم حذف المستخدم بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل في حذف المستخدم');
    }
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
    } else {
      setEditingUser(null);
      resetUserForm();
    }
    setUserFormOpen(true);
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
    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adForm),
      });
      if (!response.ok) throw new Error('Failed to create ad');
      toast.success('تم إنشاء الإعلان بنجاح');
      setAdFormOpen(false);
      resetAdForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في إنشاء الإعلان');
    }
  };

  const handleUpdateAd = async () => {
    if (!editingAd) return;
    try {
      const response = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingAd.id, ...adForm }),
      });
      if (!response.ok) throw new Error('Failed to update ad');
      toast.success('تم تحديث الإعلان بنجاح');
      setAdFormOpen(false);
      setEditingAd(null);
      resetAdForm();
      fetchData();
    } catch (error) {
      toast.error('فشل في تحديث الإعلان');
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await fetch(`/api/ads?id=${id}`, { method: 'DELETE' });
      toast.success('تم حذف الإعلان بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل في حذف الإعلان');
    }
  };

  const openAdForm = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setAdForm({
        streamId: '',
        position: ad.position,
        title: ad.title || '',
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl || '',
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
                    <div className="flex justify-between items-center gap-4">
                      <p className="text-slate-300">عدد البثوص: {streams.length}</p>
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
          </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="border-b border-slate-700">
                          <CardTitle className="text-white flex items-center gap-2">
                            <ServerCog className="h-5 w-5 text-red-400" />
                            التوسع التلقائي
                          </CardTitle>
                          <CardDescription className="text-slate-400">
                            أضف خوادم جديدة خلال فترات الذروة تلقائياً.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-slate-300">الحد الأدنى للخوادم</Label>
                              <Input
                                type="number"
                                value={autoScalingConfig.minServers}
                                onChange={(event) =>
                                  setAutoScalingConfig({
                                    ...autoScalingConfig,
                                    minServers: Number(event.target.value),
                                  })
                                }
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {streams.map((stream) => (
                        <Card key={stream.id} className="bg-slate-800/50 border-slate-700">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-white text-lg">
                                  {stream.title}
                                </CardTitle>
                                <CardDescription className="text-slate-400 mt-2">
                                  {stream.description || 'لا يوجد وصف'}
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
                          </CardHeader>
                          <CardContent>
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
                                onChange={(e) =>
                                  setAdForm({ ...adForm, position: e.target.value })
                                }
                                className="w-full bg-slate-800 border-slate-700 text-white rounded-md p-2"
                              >
                                <option value="home-top">الصفحة الرئيسية - أعلى</option>
                                <option value="home-bottom">الصفحة الرئيسية - أسفل</option>
                                <option value="stream-top">صفحة البث - أعلى</option>
                                <option value="stream-bottom">صفحة البث - أسفل</option>
                                <option value="stream-sidebar">صفحة البث - جانبي</option>
                              </select>
                            </div>
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
