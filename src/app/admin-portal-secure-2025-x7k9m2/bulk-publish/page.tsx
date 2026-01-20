'use client';

import { useState, useEffect } from 'react';
// Bulk Publish Page - Upload file or use URL to import M3U playlists
import { Upload, FileText, Check, X, Loader2, ToggleLeft, ToggleRight, Link as LinkIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface M3UChannel {
  id?: string;
  name: string;
  url: string;
  logo?: string;
  tvgId?: string;
  group?: string;
}

interface ParsedData {
  channels: M3UChannel[];
  channelCount: number;
  format: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function BulkPublishPage() {
  const [file, setFile] = useState<File | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [authorId, setAuthorId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('/api/bulk-publish/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
        if (data.users.length > 0) {
          setAuthorId(data.users[0].id);
        }
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter channels based on search query
  const filteredChannels = parsedData
    ? parsedData.channels.filter((channel) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          channel.name.toLowerCase().includes(searchLower) ||
          channel.group?.toLowerCase().includes(searchLower) ||
          channel.id?.toLowerCase().includes(searchLower) ||
          channel.tvgId?.toLowerCase().includes(searchLower)
        );
      })
    : [];

  // Paginate channels
  const totalPages = Math.ceil(filteredChannels.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedChannels = filteredChannels.slice(startIndex, endIndex);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData(null);
      setSelectedChannels(new Set());
      setProgress(0);
      setSearchQuery('');
      setCurrentPage(1);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPlaylistUrl(url);
    setParsedData(null);
    setSelectedChannels(new Set());
    setProgress(0);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleParse = async () => {
    // Validate based on input mode
    if (inputMode === 'file') {
      if (!file) {
        toast.error('Please select a file first');
        return;
      }
    } else {
      if (!playlistUrl) {
        toast.error('Please enter a playlist URL first');
        return;
      }
    }

    setIsUploading(true);

    try {
      let result;

      if (inputMode === 'file') {
        // Parse from file
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/bulk-publish/upload', {
          method: 'POST',
          body: formData,
        });

        result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed');
        }
      } else {
        // Parse from URL
        const response = await fetch('/api/playlists/parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playlistUrl: playlistUrl,
          }),
        });

        result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to parse URL');
        }
      }

      setParsedData(result.data || result);
      // Select all channels by default
      const channels = result.data ? result.data.channels : result.channels;
      setSelectedChannels(new Set(channels.map((_: M3UChannel, idx: number) => String(idx))));
      const channelCount = result.data ? result.data.channelCount : result.channelCount;
      toast.success(`Successfully parsed ${channelCount} channels`);
    } catch (error) {
      console.error('Parse error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse playlist');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAll = () => {
    if (parsedData) {
      // Select only filtered channels' original indices
      const filteredIndices = filteredChannels.map((channel) =>
        parsedData.channels.findIndex((c) => c === channel)
      );
      const newSelected = new Set(selectedChannels);
      filteredIndices.forEach((idx) => newSelected.add(String(idx)));
      setSelectedChannels(newSelected);
    }
  };

  const handleDeselectAll = () => {
    if (parsedData) {
      // Deselect only filtered channels' original indices
      const filteredIndices = filteredChannels.map((channel) =>
        parsedData.channels.findIndex((c) => c === channel)
      );
      const newSelected = new Set(selectedChannels);
      filteredIndices.forEach((idx) => newSelected.delete(String(idx)));
      setSelectedChannels(newSelected);
    }
  };

  const toggleChannel = (index: string) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedChannels(newSelected);
  };

  const handleBulkCreate = async () => {
    if (selectedChannels.size === 0) {
      toast.error('Please select at least one channel');
      return;
    }

    if (!authorId) {
      toast.error('Please enter author ID');
      return;
    }

    if (!parsedData) {
      toast.error('No parsed data available');
      return;
    }

    setIsCreating(true);
    setProgress(0);

    // Get selected channels
    const selectedChannelsList = parsedData.channels.filter((_, idx) =>
      selectedChannels.has(String(idx))
    );

    try {
      const response = await fetch('/api/bulk-publish/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: selectedChannelsList,
          authorId: authorId,
          playlistName: inputMode === 'file' ? file?.name : 'Imported from URL',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Bulk create failed');
      }

      // Animate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setProgress(i);
      }

      toast.success(`Successfully created ${result.created} streams. ${result.failed} failed.`);

      if (result.errors && result.errors.length > 0) {
        console.error('Failed channels:', result.errors);
      }

      // Reset form
      setFile(null);
      setPlaylistUrl('');
      setParsedData(null);
      setSelectedChannels(new Set());
      setProgress(0);
    } catch (error) {
      console.error('Bulk create error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create streams');
    } finally {
      setIsCreating(false);
      setProgress(100);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Bulk Publish Channels</h1>
        <p className="text-muted-foreground">
          Upload an M3U playlist file or use a URL to create multiple channels at once
        </p>
      </div>

      {/* File Upload / URL Section */}
      <div className="border rounded-lg p-6 space-y-4 bg-card">
        <h2 className="text-xl font-semibold">Import M3U Playlist</h2>

        {/* Input Mode Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setInputMode('file')}
            className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-md transition ${
              inputMode === 'file'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setInputMode('url')}
            className={`flex items-center gap-2 flex-1 px-4 py-2 rounded-md transition ${
              inputMode === 'url'
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Use URL</span>
          </button>
        </div>

        {/* File Input Mode */}
        {inputMode === 'file' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="file"
                  accept=".m3u,.m3u8"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition">
                  <FileText className="w-4 h-4" />
                  <span>Choose File</span>
                </div>
              </label>
              {file && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleParse}
              disabled={!file || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Parse File</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* URL Input Mode */}
        {inputMode === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="playlistUrl" className="text-sm font-medium">
                M3U Playlist URL
              </label>
              <input
                id="playlistUrl"
                type="url"
                value={playlistUrl}
                onChange={handleUrlChange}
                placeholder="https://iptv-org.github.io/iptv/index.m3u"
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Enter URL to an M3U or M3U8 playlist file
              </p>
            </div>

            <button
              onClick={handleParse}
              disabled={!playlistUrl || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing...</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  <span>Parse URL</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Author Selection */}
      {parsedData && (
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <h2 className="text-xl font-semibold">Author Information</h2>
          <div className="space-y-2">
            <label htmlFor="authorId" className="text-sm font-medium">
              Select Author
            </label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm">No users found in database</span>
              </div>
            ) : (
              <select
                id="authorId"
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email} {user.role === 'admin' ? '(Admin)' : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-muted-foreground">
              The user that will be marked as author of these channels
            </p>
          </div>
        </div>
      )}

      {/* Parsed Channels Section */}
      {parsedData && (
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Channels</h2>
              <p className="text-sm text-muted-foreground">
                {selectedChannels.size} of {filteredChannels.length} of {parsedData.channelCount} total selected
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels by name, group, or ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
            />
          </div>

          {/* Channel List */}
          <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {paginatedChannels.map((channel) => {
              const originalIndex = parsedData.channels.findIndex((c) => c === channel);
              return (
                <>
                  <div
                    key={`${channel.id}-${originalIndex}`}
                    className="flex items-center gap-4 p-3 border rounded-md"
                  >
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChannel(String(originalIndex));
                      }}
                      className="flex-shrink-0"
                    >
                      {selectedChannels.has(String(originalIndex)) ? (
                        <ToggleRight className="w-6 h-6 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>

                    {/* Channel Logo */}
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}

                    {/* Channel Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{channel.name}</p>
                      {channel.group && (
                        <p className="text-xs text-muted-foreground">{channel.group}</p>
                      )}
                    </div>

                    {/* Channel ID */}
                    {channel.id && (
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        ID: {channel.id}
                      </p>
                    )}
                  </div>
                </>
              );
            })}
          </div>

          {/* Bulk Create Button */}
          <button
            onClick={handleBulkCreate}
            disabled={selectedChannels.size === 0 || !authorId || isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Channels...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Create {selectedChannels.size} Channels</span>
              </>
            )}
          </button>

          {/* Progress Bar */}
          {isCreating && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {progress}% Complete
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({filteredChannels.length} channels)
                </span>
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--background));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.8);
        }
      `}</style>
    </div>
  );
}
