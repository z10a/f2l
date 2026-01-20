/* eslint-disable @typescript-eslint/no-misused-promises */
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

type Tab = 'streams' | 'users' | 'ads';

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
                    <div className="flex justify-between items-center">
                      <p className="text-slate-300">عدد البثوص: {streams.length}</p>
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
