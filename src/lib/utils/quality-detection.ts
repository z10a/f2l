/**
 * Quality Detection Utility
 * Extracts quality information from stream URLs and metadata
 */

export interface QualityInfo {
  level: 'SD' | 'HD' | 'FHD' | '4K' | 'Unknown';
  label: string;
  color: string;
  resolution?: string;
  icon?: string;
}

export interface StreamQuality {
  url: string;
  quality: QualityInfo;
}

/**
 * Quality tiers with associated metadata
 */
const QUALITY_TIERS = {
  SD: {
    level: 'SD' as const,
    label: 'SD',
    color: 'bg-slate-500 text-white',
    icon: '📺',
  },
  HD: {
    level: 'HD' as const,
    label: 'HD',
    color: 'bg-blue-500 text-white',
    icon: 'HD',
  },
  FHD: {
    level: 'FHD' as const,
    label: 'FHD',
    color: 'bg-purple-500 text-white',
    icon: '🎯',
  },
  '4K': {
    level: '4K' as const,
    label: '4K',
    color: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white',
    icon: '🌟',
  },
} as const;

/**
 * Resolution patterns to search for in URLs
 */
const RESOLUTION_PATTERNS = [
  { pattern: /\/(\d{3,4})p/, labels: ['720', '1080'], quality: 'FHD' },
  { pattern: /\/(\d{3,4})i/, labels: ['720', '1080'], quality: 'FHD' },
  { pattern: /4k/i, quality: '4K' },
  { pattern: /2160p/, quality: '4K' },
  { pattern: /2400p/, quality: '4K' },
  { pattern: /stream\/(\d+)/i, quality: 'HD' },
  { pattern: /master\/(\d+)/i, quality: 'HD' },
  { pattern: /(\d+)x(\d+)/i, labels: ['1920', '2560'], quality: 'FHD' },
  { pattern: /\/(\d{3,4})\.m3u8/i, labels: ['720', '1080'], quality: 'HD' },
  { pattern: /480p/i, quality: 'SD' },
  { pattern: /576p/i, quality: 'SD' },
];

/**
 * Detect quality from URL
 */
export function detectQualityFromUrl(url: string): QualityInfo {
  if (!url) {
    return QUALITY_TIERS.Unknown;
  }

  const urlLower = url.toLowerCase();

  // Check for 4K patterns first (highest priority)
  if (RESOLUTION_PATTERNS.some(p => urlLower.includes(p.pattern))) {
    return QUALITY_TIERS['4K'];
  }

  // Check for FHD patterns
  if (RESOLUTION_PATTERNS.slice(0, 4).some(p => urlLower.includes(p.pattern))) {
    return QUALITY_TIERS.FHD;
  }

  // Check for HD patterns
  if (RESOLUTION_PATTERNS.slice(4, 8).some(p => urlLower.includes(p.pattern))) {
    return QUALITY_TIERS.HD;
  }

  // Check for SD patterns
  if (RESOLUTION_PATTERNS.slice(8).some(p => urlLower.includes(p.pattern))) {
    return QUALITY_TIERS.SD;
  }

  // Default to HD if it's a stream URL
  if (url.includes('.m3u8') || url.includes('.m3u')) {
    return QUALITY_TIERS.HD;
  }

  return QUALITY_TIERS.Unknown;
}

/**
 * Detect quality from stream metadata (title, description)
 */
export function detectQualityFromMetadata(
  title?: string,
  description?: string
): QualityInfo {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  // Check for explicit quality mentions
  if (text.includes('4k') || text.includes('2160') || text.includes('2400')) {
    return QUALITY_TIERS['4K'];
  }

  if (text.includes('fhd') || text.includes('full hd') || text.includes('1080')) {
    return QUALITY_TIERS.FHD;
  }

  if (text.includes('hd') || text.includes('720') || text.includes('1280')) {
    return QUALITY_TIERS.HD;
  }

  // Default based on common streaming defaults
  return QUALITY_TIERS.HD;
}

/**
 * Extract resolution number from URL (if available)
 */
export function extractResolutionFromUrl(url: string): string | undefined {
  const patterns = [
    /\/(\d{3,4})p/,
    /(\d{3,4})i/,
    /(\d+)x(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const resolution = match[1].toUpperCase();
      return `${resolution}p`;
    }
  }

  return undefined;
}

/**
 * Get quality info for a stream with both URL and metadata
 */
export function getStreamQuality(
  url?: string,
  title?: string,
  description?: string
): QualityInfo {
  // Priority: metadata > URL
  if (title || description) {
    const metadataQuality = detectQualityFromMetadata(title, description);
    // Only use URL quality if metadata doesn't match
    if (metadataQuality.level !== 'Unknown') {
      return metadataQuality;
    }
  }

  // Fallback to URL detection
  return detectQualityFromUrl(url || '');
}

/**
 * Format quality for display
 */
export function formatQualityInfo(quality: QualityInfo): {
  label: string;
  className: string;
  icon: string;
} {
  return {
    label: quality.label,
    className: `${quality.color} text-xs font-bold px-2 py-0.5 rounded-full`,
    icon: quality.icon,
  };
}

/**
 * Get all available qualities for filter dropdown
 */
export function getAvailableQualities(): Array<{
  value: string;
  label: string;
}> {
  return [
    { value: '4K', label: '4K Ultra HD' },
    { value: 'FHD', label: 'Full HD (1080p)' },
    { value: 'HD', label: 'HD (720p)' },
    { value: 'SD', label: 'SD (480p/576p)' },
    { value: 'Unknown', label: 'Unknown Quality' },
  ];
}
