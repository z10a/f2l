/**
 * M3U Playlist Parser
 * Parses M3U and M3U8 playlist files to extract channel information
 */

export interface ParsedChannel {
  channelId?: string;
  channelName?: string;
  logo?: string;
  groupTitle?: string;
  tvgId?: string;
  tvgLanguage?: string;
  tvgLogo?: string;
  url: string;
  duration?: number;
  resolution?: string;
  bandwidth?: number;
  codec?: string;
}

export interface ParsedPlaylist {
  channels: ParsedChannel[];
  name?: string; // Playlist name from #EXTM3U or similar
  url: string; // Original playlist URL
  totalChannels: number;
}

/**
 * Parse M3U/M3U8 playlist content
 * @param content - The M3U file content as a string
 * @param playlistUrl - The URL of the playlist file
 * @returns Parsed playlist with channels
 */
export function parseM3UPlaylist(content: string, playlistUrl: string): ParsedPlaylist {
  const lines = content.split('\n');
  const channels: ParsedChannel[] = [];
  let playlistName: string | undefined;
  let currentChannel: Partial<ParsedChannel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Parse playlist name
    if (line.startsWith('#PLAYLIST:')) {
      const parts = line.split(':');
      if (parts.length > 1) {
        playlistName = parts.slice(1).join(':').trim();
      }
      continue;
    }

    // Parse EXTINF metadata
    if (line.startsWith('#EXTINF:')) {
      // Save previous channel if exists
      if (currentChannel.url) {
        channels.push({ ...currentChannel } as ParsedChannel);
      }

      // Reset and parse new channel metadata
      currentChannel = { url: '' };

      const metadataPart = line.substring(8); // Remove "#EXTINF:"
      const parts = metadataPart.split(',');

      for (const part of parts) {
        const [key, value] = part.split('=').map(p => p.trim());
        if (value) {
          // Duration (usually first number)
          if (key === '' && !isNaN(parseFloat(value))) {
            currentChannel.duration = parseFloat(value);
          }
          // Channel name (usually last part)
          else if (key === '' && !value.includes('=')) {
            currentChannel.channelName = value.replace(/^"|"$/g, '');
          }
          // TVG-ID (TV Guide ID)
          else if (key.toLowerCase() === 'tvg-id') {
            currentChannel.tvgId = value.replace(/^"|"$/g, '');
          }
          // TVG-NAME (TV Guide Name)
          else if (key.toLowerCase() === 'tvg-name') {
            currentChannel.channelName = value.replace(/^"|"$/g, '');
          }
          // TVG-LOGO (TV Guide Logo)
          else if (key.toLowerCase() === 'tvg-logo') {
            currentChannel.logo = value.replace(/^"|"$/g, '');
            currentChannel.tvgLogo = value.replace(/^"|"$/g, '');
          }
          // TVG-LANGUAGE (TV Guide Language)
          else if (key.toLowerCase() === 'tvg-language') {
            currentChannel.tvgLanguage = value.replace(/^"|"$/g, '');
          }
          // GROUP-TITLE (Category/Group)
          else if (key.toLowerCase() === 'group-title') {
            currentChannel.groupTitle = value.replace(/^"|"$/g, '');
          }
          // Bandwidth
          else if (key.toLowerCase() === 'bandwidth') {
            const bandwidthMatch = value.match(/\d+/);
            if (bandwidthMatch) {
              currentChannel.bandwidth = parseInt(bandwidthMatch[0]);
            }
          }
          // Resolution
          else if (key.toLowerCase() === 'resolution') {
            currentChannel.resolution = value.replace(/^"|"$/g, '');
          }
          // CODECS
          else if (key.toLowerCase() === 'codecs') {
            currentChannel.codec = value.replace(/^"|"$/g, '');
          }
        }
      }
      continue;
    }

    // Parse stream URL (non-comment line)
    if (!line.startsWith('#') && line.trim()) {
      currentChannel.url = line.trim();
    }
  }

  // Add the last channel
  if (currentChannel.url) {
    channels.push({ ...currentChannel } as ParsedChannel);
  }

  return {
    channels,
    name: playlistName,
    url: playlistUrl,
    totalChannels: channels.length,
  };
}

/**
 * Fetch and parse M3U playlist from URL
 * @param playlistUrl - The URL of the M3U playlist
 * @returns Parsed playlist with channels
 */
export async function fetchAndParsePlaylist(playlistUrl: string): Promise<ParsedPlaylist> {
  try {
    // Try to fetch through a proxy or directly
    const response = await fetch(playlistUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/x-mpegurl, text/plain, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.statusText}`);
    }

    const content = await response.text();
    return parseM3UPlaylist(content, playlistUrl);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw new Error(`Failed to parse playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format channel name for display
 * @param channel - The parsed channel data
 * @returns Formatted channel name or fallback
 */
export function formatChannelName(channel: ParsedChannel): string {
  return (
    channel.channelName ||
    channel.tvgName ||
    `قناة ${channel.channelId || ''}`
  );
}

/**
 * Format channel with priority
 * @param channel - The parsed channel data
 * @param priority - Priority index
 * @returns Channel with priority indicator
 */
export function formatChannelWithPriority(channel: ParsedChannel, priority: number): string {
  const baseName = formatChannelName(channel);
  return `${baseName} (الأولوية ${priority + 1})`;
}

/**
 * Filter channels by group/category
 * @param channels - Array of parsed channels
 * @param groupTitle - The group title to filter by
 * @returns Filtered channels
 */
export function filterChannelsByGroup(
  channels: ParsedChannel[],
  groupTitle: string
): ParsedChannel[] {
  return channels.filter(channel => {
    const normalizedChannelGroup = (channel.groupTitle || '').toLowerCase().trim();
    const normalizedFilterGroup = groupTitle.toLowerCase().trim();
    return normalizedChannelGroup.includes(normalizedFilterGroup);
  });
}

/**
 * Search channels by name
 * @param channels - Array of parsed channels
 * @param query - Search query
 * @returns Matching channels
 */
export function searchChannels(
  channels: ParsedChannel[],
  query: string
): ParsedChannel[] {
  const normalizedQuery = query.toLowerCase();
  return channels.filter(channel => {
    const name = (channel.channelName || channel.tvgName || '').toLowerCase();
    return name.includes(normalizedQuery);
  });
}
