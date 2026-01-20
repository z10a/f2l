/**
 * M3U Playlist Parser
 * Parses M3U and M3U8 playlist files to extract channel information
 */

export interface M3UChannel {
  id?: string;          // Channel ID from #EXTINF
  name: string;         // Channel name
  url: string;          // Stream URL (M3U/M3U8)
  logo?: string;         // Channel logo URL (tvg-logo)
  tvgId?: string;       // TV guide ID
  tvgName?: string;     // TV guide name
  group?: string;        // Channel group/category
  resolution?: string;   // Video resolution
  bandwidth?: number;     // Bandwidth in bits
  languages?: string;     // Available languages
}

export interface M3UParsedData {
  url: string;           // Original playlist URL
  channels: M3UChannel[]; // Parsed channels
  channelCount: number;    // Total channels
  format: 'm3u' | 'm3u8' | 'unknown';
  metadata?: {
    title?: string;
    author?: string;
    copyright?: string;
  };
}

/**
 * Parse M3U/M3U8 playlist from URL or content
 */
export async function parseM3U(playlist: string | URL): Promise<M3UParsedData> {
  try {
    // Fetch playlist if URL is provided
    let playlistContent: string;

    if (typeof playlist === 'string') {
      playlistContent = playlist;
    } else if (playlist instanceof URL) {
      const response = await fetch(playlist.toString(), {
        // Add cache-busting to avoid CORS issues
        cache: 'no-store',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch playlist: ${response.statusText}`);
      }

      playlistContent = await response.text();
    } else {
      throw new Error('Invalid playlist input: must be string or URL');
    }

    return parseM3UContent(playlistContent, playlist instanceof URL ? playlist.toString() : 'local');
  } catch (error) {
    console.error('Error parsing M3U playlist:', error);
    return {
      url: '',
      channels: [],
      channelCount: 0,
      format: 'unknown',
      metadata: {},
    };
  }
}

/**
 * Parse M3U content string
 */
function parseM3UContent(content: string, source: string): M3UParsedData {
  const lines = content.split('\n').filter(line => line.trim());
  const channels: M3UChannel[] = [];

  let currentChannel: Partial<M3UChannel> = {};
  let format: 'm3u' | 'm3u8' | 'unknown' = 'unknown';

  // Detect format
  if (content.includes('#EXTM3U8')) {
    format = 'm3u8';
  } else if (content.includes('#EXTM3U')) {
    format = 'm3u';
  }

  // Parse each line
  for (const line of lines) {
    // Skip empty lines
    if (!line) continue;

    // Metadata line (#EXTINF or #EXT-X-)
    if (line.startsWith('#')) {
      parseMetadataLine(line, currentChannel);
      continue;
    }

    // URL line - create channel
    if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://')) {
      const channel = createChannelFromMetadata(currentChannel, line);
      if (channel) {
        channels.push(channel);
      }
      currentChannel = {};
    }
  }

  return {
    url: source,
    channels,
    channelCount: channels.length,
    format,
    metadata: {
      title: extractTitle(lines),
      author: extractAuthor(lines),
      copyright: extractCopyright(lines),
    },
  };
}

/**
 * Parse metadata line from M3U
 */
function parseMetadataLine(line: string, channel: Partial<M3UChannel>): void {
  // Extract attributes using regex
  const tvgLogo = extractAttribute(line, 'tvg-logo');
  const tvgId = extractAttribute(line, 'tvg-id');
  const tvgName = extractAttribute(line, 'tvg-name');
  const tvgLanguage = extractAttribute(line, 'tvg-language');

  const duration = extractAttribute(line, 'duration');
  const resolution = extractAttribute(line, 'RESOLUTION');
  const bandwidth = extractAttribute(line, 'BANDWIDTH');
  const codecs = extractAttribute(line, 'CODECS');

  const channelId = extractChannelId(line);
  const channelName = extractChannelName(line);
  const groupTitle = extractAttribute(line, 'group-title');

  // Store metadata
  if (tvgLogo) channel.channelLogo = unescapeQuotes(tvgLogo);
  if (tvgId) channel.tvgId = unescapeQuotes(tvgId);
  if (tvgName) channel.tvgName = unescapeQuotes(tvgName);
  if (tvgLanguage) channel.languages = unescapeQuotes(tvgLanguage);
  if (duration) channel.duration = parseInt(duration, 10);
  if (resolution) channel.resolution = unescapeQuotes(resolution);
  if (bandwidth) channel.bandwidth = parseInt(bandwidth, 10);
  if (codecs) channel.languages = unescapeQuotes(codecs);
  if (channelId) channel.id = channelId;
  if (channelName) channel.name = channelName;
  if (groupTitle) channel.group = unescapeQuotes(groupTitle);
}

/**
 * Extract attribute value from M3U line
 */
function extractAttribute(line: string, attributeName: string): string | undefined {
  const regex = new RegExp(`${attributeName}="([^"]*)"`, 'i');
  const match = line.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Extract channel ID
 */
function extractChannelId(line: string): string | undefined {
  const regex = /tvg-id="([^"]*)"/i;
  const match = line.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Extract channel name
 */
function extractChannelName(line: string): string | undefined {
  // Try tvg-name first, then fallback to comma-separated value
  let name = extractAttribute(line, 'tvg-name');

  if (!name) {
    const regex = /#EXTINF:-1[^,]*,(.*)$/i;
    const match = line.match(regex);
    if (match) {
      name = match[1].trim();
      // Remove logo and other attributes from name
      const parts = name.split(',');
      const namePart = parts.find((part: string) => !part.includes('='));
      if (namePart) {
        name = namePart.trim();
      }
    }
  }

  return name;
}

/**
 * Create channel object from metadata
 */
function createChannelFromMetadata(metadata: Partial<M3UChannel>, url: string): M3UChannel | null {
  if (!metadata.name) {
    return null;
  }

  return {
    id: metadata.id,
    name: metadata.name || 'Unknown Channel',
    url: url.trim(),
    logo: metadata.channelLogo,
    tvgId: metadata.tvgId,
    tvgName: metadata.tvgName,
    group: metadata.group,
    resolution: metadata.resolution,
    bandwidth: metadata.bandwidth,
  };
}

/**
 * Extract playlist title
 */
function extractTitle(lines: string[]): string | undefined {
  for (const line of lines) {
    if (line.startsWith('#PLAYLIST')) {
      const match = line.match(/:(.*)$/);
      if (match) return match[1].trim();
    }
  }
  return undefined;
}

/**
 * Extract playlist author
 */
function extractAuthor(lines: string[]): string | undefined {
  for (const line of lines) {
    if (line.startsWith('#EXT-X-PLAYLIST-INFO:AUTHOR')) {
      const match = line.match(/AUTHOR="([^"]*)"$/);
      if (match) return match[1];
    }
  }
  return undefined;
}

/**
 * Extract copyright
 */
function extractCopyright(lines: string[]): string | undefined {
  for (const line of lines) {
    if (line.startsWith('#EXT-X-PLAYLIST-INFO:COPYRIGHT')) {
      const match = line.match(/COPYRIGHT="([^"]*)"$/);
      if (match) return match[1];
    }
  }
  return undefined;
}

/**
 * Remove quotes from string
 */
function unescapeQuotes(str: string | undefined): string {
  if (!str) return '';
  return str.replace(/^"|"$/g, '');
}
