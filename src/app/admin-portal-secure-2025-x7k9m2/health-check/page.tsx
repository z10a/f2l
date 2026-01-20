'use client';

import { useState } from 'react';
import { PlayCircle, XCircle, RefreshCw, Filter, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface HealthCheckResult {
  streamId: string;
  streamTitle: string;
  serverId: string;
  serverName: string;
  url: string;
  status: 'working' | 'broken';
  statusCode?: number;
  error?: string;
  checkTime: string;
}

interface HealthCheckStats {
  total: number;
  working: number;
  broken: number;
  workingRate: string;
}

export default function HealthCheckPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [stats, setStats] = useState<HealthCheckStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'working' | 'broken'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCheckAll = async () => {
    setIsChecking(true);
    setResults([]);
    setStats(null);

    try {
      const response = await fetch('/api/admin/health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checkAll: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Health check failed');
      }

      setResults(data.results);
      setStats(data.stats);
      toast.success(`Checked ${data.summary.totalServers} servers across ${data.summary.totalStreams} streams`);
    } catch (error) {
      console.error('Health check error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to check channels');
    } finally {
      setIsChecking(false);
    }
  };

  const filteredResults = results.filter((result) => {
    if (filter === 'all') return true;
    return result.status === filter;
  });

  const searchedResults = filteredResults.filter((result) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      result.streamTitle.toLowerCase().includes(searchLower) ||
      result.serverName.toLowerCase().includes(searchLower) ||
      result.url.toLowerCase().includes(searchLower)
    );
  });

  const exportResults = () => {
    const csvContent = [
      'Stream Title,Server Name,URL,Status,Status Code,Error,Checked At',
      ...searchedResults.map(r =>
        `"${r.streamTitle}","${r.serverName}","${r.url}","${r.status}","${r.statusCode || ''}","${r.error || ''}","${r.checkTime}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-check-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Exported results to CSV');
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Channel Health Check</h1>
        <p className="text-muted-foreground">
          Check all channels to find broken or non-working stream links
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-3">
              <Filter className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Checked</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.working}</p>
                <p className="text-sm text-muted-foreground">Working</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.broken}</p>
                <p className="text-sm text-muted-foreground">Broken</p>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.workingRate}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          {/* Check Button */}
          <button
            onClick={handleCheckAll}
            disabled={isChecking}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Checking Channels...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>Check All Channels</span>
              </>
            )}
          </button>

          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'working' | 'broken')}
            className="px-4 py-2 border rounded-md bg-background"
            disabled={results.length === 0}
          >
            <option value="all">All Results</option>
            <option value="working">Working Only</option>
            <option value="broken">Broken Only</option>
          </select>
        </div>

        {/* Search and Export */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search results..."
            className="px-4 py-2 border rounded-md bg-background"
            disabled={results.length === 0}
          />
          <button
            onClick={exportResults}
            disabled={results.length === 0}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        {results.length === 0 && !isChecking && (
          <div className="text-center py-16 px-6">
            <Filter className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
            <p className="text-muted-foreground">
              Click "Check All Channels" to start checking your streams
            </p>
          </div>
        )}

        {isChecking && (
          <div className="text-center py-16 px-6">
            <RefreshCw className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-xl font-semibold mb-2">Checking Channels...</h3>
            <p className="text-muted-foreground">
              This may take a few minutes depending on the number of channels
            </p>
          </div>
        )}

        {searchedResults.length > 0 && (
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right font-medium border-b">Stream Title</th>
                  <th className="px-4 py-3 text-left font-medium border-b">Server</th>
                  <th className="px-4 py-3 text-left font-medium border-b">URL</th>
                  <th className="px-4 py-3 text-center font-medium border-b">Status</th>
                  <th className="px-4 py-3 text-center font-medium border-b">Code</th>
                  <th className="px-4 py-3 text-left font-medium border-b">Error</th>
                </tr>
              </thead>
              <tbody>
                {searchedResults.map((result, idx) => (
                  <tr key={`${result.serverId}-${idx}`} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 border-b">
                      <div className="max-w-[200px] truncate font-medium">
                        {result.streamTitle}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b text-sm text-muted-foreground">
                      {result.serverName}
                    </td>
                    <td className="px-4 py-3 border-b">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="max-w-[300px] truncate block text-blue-500 hover:underline"
                      >
                        {result.url}
                      </a>
                    </td>
                    <td className="px-4 py-3 border-b text-center">
                      {result.status === 'working' ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Working
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Broken
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b text-center text-sm text-muted-foreground">
                      {result.statusCode || '-'}
                    </td>
                    <td className="px-4 py-3 border-b">
                      <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={result.error}>
                        {result.error || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {searchedResults.length === 0 && results.length > 0 && !isChecking && (
          <div className="text-center py-16 px-6">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              Try changing the filter or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
